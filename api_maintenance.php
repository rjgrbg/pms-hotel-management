<?php
// API Endpoint for Maintenance C.R.U.D.

// check_session.php already includes session_start()
include('check_session.php');
require_login(['maintenance_manager']);
require_once('db_connection.php');

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Add PHPMailer includes
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Use __DIR__ for reliable paths
require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/email_config.php'; // keep your config as-is

// ✅ Create a local mailer instance for this file (no getMailer dependency)
$mail = new PHPMailer(true);
$mail->isSMTP();
$mail->Host       = 'smtp.gmail.com';
$mail->SMTPAuth   = true;
$mail->Username   = GMAIL_EMAIL;          // must be defined in your config
$mail->Password   = GMAIL_APP_PASSWORD;   // must be defined in your config
$mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
$mail->Port       = 465;

// ===== HELPER FUNCTIONS FOR DATE FORMATTING =====
function formatDbDateForDisplay($date) {
    if (!$date) return 'N/A';
    try {
        return date('m.d.Y', strtotime($date));
    } catch (Exception $e) {
        return 'N/A';
    }
}

function formatDbDateTimeForDisplay($datetime) {
    if (!$datetime) return 'Never';
    try {
        return date('g:iA/m.d.Y', strtotime($datetime));
    } catch (Exception $e) {
        return 'Never';
    }
}
// ===== END OF HELPER FUNCTIONS =====

// Get the incoming JSON data
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['action'])) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request.']);
    exit;
}

$action = $data['action'];

switch ($action) {

    // --- ASSIGN MAINTENANCE TASK (MODIFIED) ---
    case 'assign_task':
        try {
            $roomId = $data['roomId'];
            $staffId = $data['staffId'];
            $issueTypes = $data['issueTypes'] ?? 'Not Specified'; // Get from maintenance.js
            
            // *** FIXED: Get the manager's UserID from the session ***
            $managerUserId = $_SESSION['UserID'];

            // 1. Check if an active request *already* exists for this room
            $stmt_check = $conn->prepare(
                "SELECT RequestID FROM pms.maintenance_requests 
                 WHERE RoomID = ? AND Status IN ('Pending', 'In Progress')"
            );
            $stmt_check->bind_param("i", $roomId);
            $stmt_check->execute();
            $result_check = $stmt_check->get_result();
            
            if ($result_check->num_rows > 0) {
                throw new Exception("This room already has an active maintenance request.");
            }

            // 2. No active request found, so CREATE a new one
            // *** FIXED: Added UserID (the manager) to the INSERT query ***
            $stmt_insert = $conn->prepare(
                "INSERT INTO pms.maintenance_requests 
                 (RoomID, UserID, AssignedUserID, IssueType, Status, DateRequested) 
                 VALUES (?, ?, ?, ?, 'Pending', NOW())"
            );
            // *** FIXED: Added manager's ID and changed bind_param to "iiis" ***
            $stmt_insert->bind_param("iiis", $roomId, $managerUserId, $staffId, $issueTypes);
            
            // *** FIXED: Added check to show the *real* SQL error if it fails ***
            if (!$stmt_insert->execute()) {
                throw new Exception("Database INSERT failed: " . $stmt_insert->error);
            }
            
            $requestId = $conn->insert_id; // Get the ID of the new request

            if ($requestId === 0) {
                 // This is now a fallback error
                 throw new Exception("Failed to create new maintenance request (insert_id was 0). Check table AUTO_INCREMENT.");
            }

            // 3. Update staff status to 'Assigned'
            $stmt_status = $conn->prepare(
                "UPDATE pms.users SET AvailabilityStatus = 'Assigned' WHERE UserID = ?"
            );
            $stmt_status->bind_param("i", $staffId);
            $stmt_status->execute();

            // 4. Get staff + room info for email
            $stmt_info = $conn->prepare(
                "SELECT 
                    u.Fname, u.Lname, e.EmailAddress,
                    r.RoomNumber, r.FloorNumber, r.RoomType
                FROM 
                    pms.users u
                JOIN 
                    hris.employees e ON u.EmployeeID = e.EmployeeID
                JOIN
                    crm.rooms r ON r.RoomID = ?
                WHERE 
                    u.UserID = ?"
            );
            // Bind params for RoomID and UserID
            $stmt_info->bind_param("ii", $roomId, $staffId);
            $stmt_info->execute();
            $info = $stmt_info->get_result()->fetch_assoc();

            if (!$info) {
                throw new Exception("Could not find staff or room details for email.");
            }

            $staffName = $info['Fname'] . ' ' . $info['Lname'];
            $staffEmail = $info['EmailAddress'];

            // 5. Send email
            $mail->setFrom(GMAIL_EMAIL, EMAIL_FROM_NAME);
            $mail->addAddress($staffEmail, $staffName);
            $mail->Subject = 'New Maintenance Task Assigned: Room ' . $info['RoomNumber'];

            $taskLink = "http://localhost:3000/mt_assign_staff.html?request_id=" . $requestId;

            $mail->isHTML(true);
            $mail->Body = "
                <p>Hello $staffName,</p>
                <p>A new maintenance task has been assigned to you for <strong>Room " . $info['RoomNumber'] . " (Floor " . $info['FloorNumber'] . ")</strong>.</p>
                <p><strong>Issue Type(s):</strong> $issueTypes</p>
                <p>Please review the task details and update the status by clicking the link below:</p>
                <p><a href='$taskLink' style='padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;'>View Task Details</a></p>
                <p>Thank you,<br>Maintenance Management</p>
            ";

            $mail->send();
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Task assigned and email sent!',
                'staffName' => $staffName
            ]);

        } catch (Exception $e) {
            error_log("Assign Task Error: " . $e->getMessage());
            echo json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        }
        break;

    default:
        echo json_encode(['status' => 'error', 'message' => 'Unknown action.']);
        break;
}

$conn->close();
?>