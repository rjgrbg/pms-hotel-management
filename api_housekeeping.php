<?php
// API Endpoint for Housekeeping C.R.U.D.

// check_session.php already includes session_start()
include('check_session.php');
require_login(['housekeeping_manager']); // --- MODIFIED
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
require __DIR__ . '/email_config.php'; 

// Create a local mailer instance
$mail = new PHPMailer(true);
$mail->isSMTP();
$mail->Host       = 'smtp.gmail.com';
$mail->SMTPAuth   = true;
$mail->Username   = GMAIL_EMAIL;          
$mail->Password   = GMAIL_APP_PASSWORD;   
$mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
$mail->Port       = 465;

// ===== HELPER FUNCTIONS =====

// *** NEW: Logging Function ***
function logHousekeepingAction($conn, $taskId, $roomId, $userId, $action, $details) { // --- MODIFIED
    try {
        $stmt = $conn->prepare(
            "INSERT INTO pms.housekeeping_logs (TaskID, RoomID, UserID, Action, Details) 
             VALUES (?, ?, ?, ?, ?)" // --- MODIFIED
        );
        $stmt->bind_param("iiiss", $taskId, $roomId, $userId, $action, $details); // --- MODIFIED
        $stmt->execute();
    } catch (Exception $e) {
        // Log the error but don't stop the main process
        error_log("Failed to log housekeeping action: " . $e->getMessage()); // --- MODIFIED
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
$managerUserId = $_SESSION['UserID']; // Get manager's ID for logging

switch ($action) {

    // --- ASSIGN HOUSEKEEPING TASK (MODIFIED) ---
    case 'assign_task':
        try {
            $conn->begin_transaction();
            
            $roomId = $data['roomId'];
            $staffId = $data['staffId'];
            $taskTypes = $data['taskTypes'] ?? 'Not Specified'; // --- MODIFIED

            // 1. Check if an active task *already* exists for this room
            $stmt_check = $conn->prepare(
                "SELECT TaskID FROM pms.housekeeping_tasks 
                 WHERE RoomID = ? AND Status IN ('Pending', 'In Progress')" // --- MODIFIED
            );
            $stmt_check->bind_param("i", $roomId);
            $stmt_check->execute();
            $result_check = $stmt_check->get_result();
            
            if ($result_check->num_rows > 0) {
                throw new Exception("This room already has an active housekeeping task."); // --- MODIFIED
            }

            // 2. CREATE a new task
            $stmt_insert = $conn->prepare(
                "INSERT INTO pms.housekeeping_tasks 
                 (RoomID, UserID, AssignedUserID, TaskType, Status, DateRequested) 
                 VALUES (?, ?, ?, ?, 'Pending', NOW())" // --- MODIFIED
            );
            $stmt_insert->bind_param("iiis", $roomId, $managerUserId, $staffId, $taskTypes); // --- MODIFIED
            
            if (!$stmt_insert->execute()) {
                throw new Exception("Database INSERT failed: " . $stmt_insert->error);
            }
            
            $taskId = $conn->insert_id; // --- MODIFIED

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
            $mail->Subject = 'New Housekeeping Task Assigned: Room ' . $info['RoomNumber']; // --- MODIFIED
            $taskLink = "http://localhost:3000/hk_assign_staff.html?task_id=" . $taskId; // --- MODIFIED
            $mail->isHTML(true);
            $mail->Body = "
                <p>Hello $staffName,</p>
                <p>A new housekeeping task has been assigned to you for <strong>Room " . $info['RoomNumber'] . " (Floor " . $info['FloorNumber'] . ")</strong>.</p>
                <p><strong>Task(s):</strong> $taskTypes</p>
                <p>Please review the task details and update the status by clicking the link below:</p>
                <p><a href='$taskLink' style='padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;'>View Task Details</a></p>
                <p>Thank you,<br>Housekeeping Management</p>
            "; // --- MODIFIED
            $mail->send();

            // 6. *** ADDED: Log the action ***
            logHousekeepingAction($conn, $taskId, $roomId, $managerUserId, 'ASSIGNED', "Task assigned to staff $staffName (ID: $staffId) by manager (ID: $managerUserId). Tasks: $taskTypes"); // --- MODIFIED
            
            $conn->commit();
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Task assigned and email sent!',
                'staffName' => $staffName
            ]);

        } catch (Exception $e) {
            $conn->rollback();
            error_log("Assign Task Error: " . $e->getMessage());
            echo json_encode([
                'status' => 'error',
                'message' => $e->getMessage()
            ]);
        }
        break;

    // --- *** ADDED: 'cancel_task' case *** ---
    case 'cancel_task':
        try {
            $conn->begin_transaction();

            $taskId = $data['taskId'] ?? null; // --- MODIFIED
            if (!$taskId) {
                throw new Exception("Task ID is required."); // --- MODIFIED
            }

            // 1. Get task info (RoomID, AssignedUserID) *before* updating
            $stmt_info = $conn->prepare(
                "SELECT RoomID, AssignedUserID, Status FROM pms.housekeeping_tasks WHERE TaskID = ?" // --- MODIFIED
            );
            $stmt_info->bind_param("i", $taskId); // --- MODIFIED
            $stmt_info->execute();
            $info = $stmt_info->get_result()->fetch_assoc();

            if (!$info) {
                throw new Exception("Task not found."); // --- MODIFIED
            }
            
            if ($info['Status'] !== 'Pending') {
                throw new Exception("Only 'Pending' tasks can be cancelled."); // --- MODIFIED
            }

            $roomId = $info['RoomID'];
            $staffId = $info['AssignedUserID'];

            // 2. Update the task status to 'Cancelled' and add a remark
            $stmt_update = $conn->prepare(
                "UPDATE pms.housekeeping_tasks 
                 SET Status = 'Cancelled', Remarks = 'Cancelled by Manager' 
                 WHERE TaskID = ?" // --- MODIFIED
            );
            $stmt_update->bind_param("i", $taskId); // --- MODIFIED
            $stmt_update->execute();

            // 3. If a staff member was assigned, update their status back to 'Available'
            if ($staffId) {
                $stmt_staff = $conn->prepare(
                    "UPDATE pms.users SET AvailabilityStatus = 'Available' WHERE UserID = ?"
                );
                $stmt_staff->bind_param("i", $staffId);
                $stmt_staff->execute();
            }

            // 4. Log the action
            logHousekeepingAction($conn, $taskId, $roomId, $managerUserId, 'CANCELLED', "Task cancelled by manager (ID: $managerUserId)."); // --- MODIFIED

            $conn->commit();

            echo json_encode([
                'status' => 'success',
                'message' => 'Housekeeping task has been cancelled.' // --- MODIFIED
            ]);

        } catch (Exception $e) {
            $conn->rollback();
            error_log("Cancel Task Error: " . $e->getMessage());
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