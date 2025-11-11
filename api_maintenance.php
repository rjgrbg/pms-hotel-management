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


// ===== HELPER FUNCTION TO UPDATE ROOM STATUS =====
function updateRoomStatusBasedOnAppliances($conn, $roomId) {
    // Check if any appliance in this room needs repair
    $stmt = $conn->prepare(
        "SELECT COUNT(*) as broken_count 
         FROM pms.room_appliances 
         WHERE RoomID = ? AND Status IN ('Needs Repair', 'Out of Service')"
    );
    $stmt->bind_param("i", $roomId);
    if (!$stmt->execute()) { throw new Exception("Stmt 1 failed: " . $stmt->error); }
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    
    // Get the room number for this RoomID
    $stmt2 = $conn->prepare("SELECT RoomNumber FROM crm.rooms WHERE RoomID = ?");
    $stmt2->bind_param("i", $roomId);
    if (!$stmt2->execute()) { throw new Exception("Stmt 2 failed: " . $stmt2->error); }
    $result2 = $stmt2->get_result();
    $roomData = $result2->fetch_assoc();
    
    $userId = 0;
    if (isset($_SESSION['UserID'])) {
        $userId = (int)$_SESSION['UserID'];
    }
    if ($userId === 0) {
        error_log("updateRoomStatusBasedOnAppliances: No UserID in session.");
        return; 
    }

    if ($roomData) {
        $roomNumber = $roomData['RoomNumber'];
        
        if ($row['broken_count'] > 0) {
            // Set room status to Maintenance
            $stmt3 = $conn->prepare(
                "INSERT INTO pms.room_status (RoomNumber, RoomStatus, LastMaintenance, UserID) 
                 VALUES (?, 'Maintenance', NOW(), ?) 
                 ON DUPLICATE KEY UPDATE RoomStatus = 'Maintenance', LastMaintenance = NOW(), UserID = ?"
            );
            $stmt3->bind_param("sii", $roomNumber, $userId, $userId);
            if (!$stmt3->execute()) {
                throw new Exception("Database error (stmt3): " . $stmt3->error);
            }
            
            // Create maintenance request if it doesn't exist
            $stmt4 = $conn->prepare(
                "SELECT COUNT(*) as pending_count 
                 FROM pms.maintenance_requests 
                 WHERE RoomID = ? AND Status = 'Pending'"
            );
            $stmt4->bind_param("i", $roomId);
            if (!$stmt4->execute()) { throw new Exception("Stmt 4 failed: " . $stmt4->error); }
            $result4 = $stmt4->get_result();
            $pendingRow = $result4->fetch_assoc();
            
            if ($pendingRow['pending_count'] == 0) {
                // Insert the new maintenance request
                $stmt5 = $conn->prepare(
                    "INSERT INTO pms.maintenance_requests 
                     (RoomID, UserID, IssueType, Description, Status, DateRequested) 
                     VALUES (?, ?, 'Appliance', 'Appliance reported as ''Needs Repair'' or ''Out of Service''.', 'Pending', NOW())"
                );
                $stmt5->bind_param("ii", $roomId, $userId);
                if (!$stmt5->execute()) {
                    throw new Exception("Database error (stmt5): " . $stmt5->error);
                }
            }
        } else {
            // Check if there are any pending maintenance requests
            $stmt6 = $conn->prepare(
                "SELECT COUNT(*) as pending_count 
                 FROM pms.maintenance_requests 
                 WHERE RoomID = ? AND Status = 'Pending'"
            );
            $stmt6->bind_param("i", $roomId);
            if (!$stmt6->execute()) { throw new Exception("Stmt 6 failed: " . $stmt6->error); }
            $result6 = $stmt6->get_result();
            $pendingRow = $result6->fetch_assoc();
            
            // Only set to Available if no pending maintenance
            if ($pendingRow['pending_count'] == 0) {
                $stmt7 = $conn->prepare(
                    "UPDATE pms.room_status 
                     SET RoomStatus = 'Available', UserID = ?
                     WHERE RoomNumber = ?"
                );
                $stmt7->bind_param("is", $userId, $roomNumber);
                if (!$stmt7->execute()) {
                    throw new Exception("Database error (stmt7): " . $stmt7->error);
                }
            }
        }
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
    // --- ADD APPLIANCE ---
    case 'add_appliance':
        try {
            $modelNumber = $data['modelNumber'];
            $stmt_check = $conn->prepare("SELECT ApplianceID FROM pms.room_appliances WHERE ModelNumber = ?");
            $stmt_check->bind_param("s", $modelNumber);
            $stmt_check->execute();
            $result_check = $stmt_check->get_result();
            
            if ($result_check->num_rows > 0) {
                throw new Exception('An appliance with this Model Number already exists.');
            }

            $stmt = $conn->prepare(
                "INSERT INTO pms.room_appliances (RoomID, ApplianceType, ApplianceName, Manufacturer, ModelNumber, InstalledDate, Status, Remarks, LastMaintainedDate) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)"
            );
            
            $roomId = (int)$data['roomId']; 
            $status = 'Working';
            $remarks = $data['remarks'] ?? ''; 
            
            $stmt->bind_param(
                "isssssss", 
                $roomId,
                $data['type'],
                $data['item'],
                $data['manufacturer'],
                $modelNumber,
                $data['installedDate'],
                $status,
                $remarks
            );
            
            $stmt->execute();
            $newApplianceId = $conn->insert_id;
            updateRoomStatusBasedOnAppliances($conn, $roomId);
            
            $newRecord = fetchApplianceById($conn, $newApplianceId);
            if ($newRecord) {
                echo json_encode(['status' => 'success', 'data' => $newRecord]);
            } else {
                throw new Exception('Failed to fetch new record after insert.');
            }

        } catch (Exception $e) {
            echo json_encode([
                'status' => 'error', 
                'message' => $e->getMessage()
            ]);
        }
        break;

    // --- EDIT APPLIANCE STATUS ---
    case 'edit_appliance_status':
        try {
            $applianceId = $data['id'];
            $status = $data['status'];
            $remarks = $data['remarks'];
            
            $stmt = $conn->prepare("SELECT RoomID FROM pms.room_appliances WHERE ApplianceID = ?");
            $stmt->bind_param("i", $applianceId);
            $stmt->execute();
            $result = $stmt->get_result();
            $applianceData = $result->fetch_assoc();
            $roomId = $applianceData['RoomID'];
            
            $lastMaintainedDate = null;
            $sql = "";
            $types = "";

            if ($status === 'Working' || $status === 'Under Maintenance') {
                $lastMaintainedDate = date('Y-m-d H:i:s');
                $sql = "UPDATE pms.room_appliances 
                        SET Status = ?, Remarks = ?, LastMaintainedDate = ? 
                        WHERE ApplianceID = ?";
                $types = "sssi";
            } else {
                $sql = "UPDATE pms.room_appliances 
                        SET Status = ?, Remarks = ? 
                        WHERE ApplianceID = ?";
                $types = "ssi";
            }

            $stmt = $conn->prepare($sql);
            
            if ($status === 'Working' || $status === 'Under Maintenance') {
                 $stmt->bind_param($types, $status, $remarks, $lastMaintainedDate, $applianceId);
            } else {
                 $stmt->bind_param($types, $status, $remarks, $applianceId);
            }
            
            $stmt->execute();
            updateRoomStatusBasedOnAppliances($conn, $roomId);
            
            $updatedRecord = fetchApplianceById($conn, $applianceId);
            if ($updatedRecord) {
                echo json_encode(['status' => 'success', 'data' => $updatedRecord]);
            } else {
                throw new Exception('Failed to fetch updated record.');
            }

        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    // --- DELETE APPLIANCE ---
    case 'delete_appliance':
        try {
            $stmt = $conn->prepare("SELECT RoomID FROM pms.room_appliances WHERE ApplianceID = ?");
            $stmt->bind_param("i", $data['id']);
            $stmt->execute();
            $result = $stmt->get_result();
            $applianceData = $result->fetch_assoc();
            
            if (!$applianceData) {
                throw new Exception('Appliance not found.');
            }
            
            $roomId = $applianceData['RoomID'];
            
            $stmt = $conn->prepare("DELETE FROM pms.room_appliances WHERE ApplianceID = ?");
            $stmt->bind_param("i", $data['id']);
            $stmt->execute();
            
            if ($stmt->affected_rows > 0) {
                updateRoomStatusBasedOnAppliances($conn, $roomId);
                echo json_encode(['status' => 'success']);
            } else {
                throw new Exception('Appliance not found or already deleted.');
            }
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    // --- ASSIGN MAINTENANCE TASK ---
    case 'assign_task':
        try {
            $roomId = $data['roomId'];
            $staffId = $data['staffId'];

            // Find pending request
            $stmt_find = $conn->prepare(
                "SELECT RequestID FROM pms.maintenance_requests 
                 WHERE RoomID = ? AND Status = 'Pending' 
                 ORDER BY DateRequested DESC LIMIT 1"
            );
            $stmt_find->bind_param("i", $roomId);
            $stmt_find->execute();
            $request = $stmt_find->get_result()->fetch_assoc();

            if (!$request) {
                throw new Exception("No pending maintenance request found for this room.");
            }

            $requestId = $request['RequestID'];

            // Assign task
            $stmt_assign = $conn->prepare(
                "UPDATE pms.maintenance_requests 
                 SET AssignedUserID = ?, Status = 'Pending' 
                 WHERE RequestID = ?"
            );
            $stmt_assign->bind_param("ii", $staffId, $requestId);
            $stmt_assign->execute();

            // Update staff status
            $stmt_status = $conn->prepare(
                "UPDATE pms.users SET AvailabilityStatus = 'Assigned' WHERE UserID = ?"
            );
            $stmt_status->bind_param("i", $staffId);
            $stmt_status->execute();

            // Get staff + room info
            $stmt_info = $conn->prepare(
                "SELECT 
                    u.Fname, u.Lname, e.EmailAddress,
                    r.RoomNumber, r.FloorNumber, r.RoomType
                FROM 
                    pms.maintenance_requests mr
                JOIN 
                    pms.users u ON mr.AssignedUserID = u.UserID
                JOIN 
                    hris.employees e ON u.EmployeeID = e.EmployeeID
                JOIN 
                    crm.rooms r ON mr.RoomID = r.RoomID
                WHERE 
                    mr.RequestID = ? AND u.UserID = ?"
            );
            $stmt_info->bind_param("ii", $requestId, $staffId);
            $stmt_info->execute();
            $info = $stmt_info->get_result()->fetch_assoc();

            if (!$info) {
                throw new Exception("Could not find staff or room details for email.");
            }

            $staffName = $info['Fname'] . ' ' . $info['Lname'];
            $staffEmail = $info['EmailAddress'];

            // Send email
            // Recipients
            $mail->setFrom(GMAIL_EMAIL, EMAIL_FROM_NAME);
            $mail->addAddress($staffEmail, $staffName);
            $mail->Subject = 'New Maintenance Task Assigned: Room ' . $info['RoomNumber'];

            $taskLink = "http://localhost:3000/mt_assign_staff.html?request_id=" . $requestId;

            $mail->isHTML(true);
            $mail->Body = "
                <p>Hello $staffName,</p>
                <p>A new maintenance task has been assigned to you for <strong>Room " . $info['RoomNumber'] . " (Floor " . $info['FloorNumber'] . ")</strong>.</p>
                <p><strong>Issue Type:</strong> Appliance</p>
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

// ===== Helper: Fetch appliance by ID =====
function fetchApplianceById($conn, $applianceId) {
    $sql = "SELECT 
                ra.ApplianceID, 
                ra.RoomID, 
                r.FloorNumber, 
                r.RoomNumber, 
                ra.InstalledDate, 
                ra.ApplianceType, 
                ra.ApplianceName, 
                ra.Manufacturer, 
                ra.ModelNumber, 
                ra.LastMaintainedDate, 
                ra.Status, 
                ra.Remarks 
            FROM 
                pms.room_appliances ra
            JOIN 
                crm.rooms r ON ra.RoomID = r.RoomID
            WHERE 
                ra.ApplianceID = ?";
            
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $applianceId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        return [
            'id' => $row['ApplianceID'],
            'roomId' => $row['RoomID'],
            'floor' => $row['FloorNumber'],
            'room' => $row['RoomNumber'],
            'installedDate' => formatDbDateForDisplay($row['InstalledDate']),
            'type' => $row['ApplianceType'],
            'item' => $row['ApplianceName'],
            'manufacturer' => $row['Manufacturer'],
            'modelNumber' => $row['ModelNumber'],
            'lastMaintained' => formatDbDateTimeForDisplay($row['LastMaintainedDate']),
            'status' => $row['Status'],
            'remarks' => $row['Remarks']
        ];
    }
    return null;
}

$conn->close();
?>