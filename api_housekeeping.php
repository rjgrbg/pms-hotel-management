<?php
// API Endpoint for Housekeeping C.R.U.D.

include('check_session.php');
require_login(['housekeeping_manager', 'admin']);
require_once('db_connection.php');

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/email_config.php'; 

$mail = new PHPMailer(true);
$mail->isSMTP();
$mail->Host       = 'smtp.gmail.com';
$mail->SMTPAuth   = true;
$mail->Username   = GMAIL_EMAIL;          
$mail->Password   = GMAIL_APP_PASSWORD;   
$mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
$mail->Port       = 465;

// ===== HELPER FUNCTIONS =====

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

function logHousekeepingAction($conn, $taskId, $roomId, $userId, $action, $details) {
    try {
        $stmt = $conn->prepare("INSERT INTO pms_housekeeping_logs (TaskID, RoomID, UserID, Action, Details) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("iiiss", $taskId, $roomId, $userId, $action, $details);
        $stmt->execute();
    } catch (Exception $e) {
        error_log("Failed to log housekeeping action: " . $e->getMessage());
    }
}

// ===== END HELPERS =====

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['action'])) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request.']);
    exit;
}

$action = trim($data['action'] ?? '');
$managerUserId = $_SESSION['UserID'];
$conn = get_db_connection('b9wkqgu32onfqy0dvyva');

if ($conn === null) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection error.']);
    exit;
}

switch ($action) {

    // --- 1. FETCH ALL ACTIVE TASKS (Refresh Requests Tab) ---
    case 'get_all_tasks':
        $sql = "SELECT
                r.room_id as RoomID,
                r.floor_num as FloorNumber,
                r.room_num as RoomNumber,
                rs.LastClean,
                CASE 
                    WHEN active_task.Status IS NOT NULL THEN active_task.Status
                    WHEN rs.RoomStatus = 'Needs Cleaning' THEN 'Needs Cleaning'
                    ELSE COALESCE(rs.RoomStatus, 'Available') 
                END as RoomStatus,
                active_task.DateRequested as TaskRequestDate,
                active_task.TaskID, 
                u.Fname, u.Lname, u.Mname
              FROM tbl_rooms r
              LEFT JOIN pms_room_status rs ON r.room_num = rs.RoomNumber
              LEFT JOIN (
                SELECT ht.TaskID, ht.RoomID, ht.Status, ht.DateRequested, ht.AssignedUserID,
                    ROW_NUMBER() OVER(PARTITION BY ht.RoomID ORDER BY ht.DateRequested DESC) as rn
                FROM pms_housekeeping_tasks ht
                WHERE ht.Status IN ('Pending', 'In Progress')
              ) AS active_task ON active_task.RoomID = r.room_id AND active_task.rn = 1
              LEFT JOIN pms_users u ON u.UserID = active_task.AssignedUserID
              WHERE r.is_archived = 0
              ORDER BY r.floor_num, r.room_num ASC";

        if ($result = $conn->query($sql)) {
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $requestDate = 'N/A';
                $requestTime = 'N/A';
                if (in_array($row['RoomStatus'], ['Needs Cleaning', 'Pending', 'In Progress']) && $row['TaskRequestDate']) {
                    $requestDate = formatDbDateForDisplay($row['TaskRequestDate']);
                    $requestTime = date('g:i A', strtotime($row['TaskRequestDate']));
                }
                $staffName = 'Not Assigned';
                if (!empty($row['Fname'])) {
                    $staffName = trim(htmlspecialchars($row['Fname']) . (empty($row['Mname']) ? '' : ' ' . strtoupper(substr(htmlspecialchars($row['Mname']), 0, 1)) . '.') . ' ' . htmlspecialchars($row['Lname']));
                }
                $data[] = [
                    'id' => $row['RoomID'],
                    'taskId' => $row['TaskID'],
                    'floor' => $row['FloorNumber'],
                    'room' => $row['RoomNumber'],
                    'lastClean' => formatDbDateTimeForDisplay($row['LastClean']),
                    'date' => $requestDate,
                    'requestTime' => $requestTime,
                    'status' => $row['RoomStatus'],
                    'staff' => $staffName
                ];
            }
            echo json_encode(['status' => 'success', 'data' => $data]);
        } else {
            echo json_encode(['status' => 'error', 'message' => $conn->error]);
        }
        break;

    // --- 2. FETCH HISTORY (Refresh History Tab) ---
    case 'get_all_history':
        $sql = "SELECT 
                    ht.TaskID, r.floor_num as FloorNumber, r.room_num as RoomNumber, 
                    ht.TaskType, ht.DateRequested, ht.DateCompleted, 
                    u.Fname, u.Lname, u.Mname, ht.Status, ht.Remarks 
                FROM pms_housekeeping_tasks ht
                JOIN tbl_rooms r ON ht.RoomID = r.room_id
                LEFT JOIN pms_users u ON ht.AssignedUserID = u.UserID 
                WHERE ht.Status IN ('In Progress', 'Completed', 'Cancelled')
                ORDER BY 
                    CASE 
                        WHEN ht.Status = 'In Progress' THEN 1
                        WHEN ht.Status = 'Completed'   THEN 2
                        WHEN ht.Status = 'Cancelled'   THEN 3
                    END ASC,
                    ht.DateCompleted DESC, ht.DateRequested DESC";

        if ($result = $conn->query($sql)) {
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $staffName = 'N/A';
                if ($row['Fname']) {
                    $staffName = trim(htmlspecialchars($row['Fname']) . (empty($row['Mname']) ? '' : ' ' . strtoupper(substr(htmlspecialchars($row['Mname']), 0, 1)) . '.') . ' ' . htmlspecialchars($row['Lname']));
                }
                $data[] = [
                    'id' => $row['TaskID'],
                    'floor' => $row['FloorNumber'],
                    'room' => $row['RoomNumber'],
                    'issueType' => $row['TaskType'],
                    'date' => formatDbDateForDisplay($row['DateRequested']),
                    'requestedTime' => date('g:i A', strtotime($row['DateRequested'])),
                    'completedTime' => $row['DateCompleted'] ? date('g:i A', strtotime($row['DateCompleted'])) : 'N/A',
                    'staff' => $staffName,
                    'status' => $row['Status'],
                    'remarks' => $row['Remarks']
                ];
            }
            echo json_encode(['status' => 'success', 'data' => $data]);
        } else {
            echo json_encode(['status' => 'error', 'message' => $conn->error]);
        }
        break;

    // --- 3. ASSIGN TASK ---
    case 'assign_task':
        try {
            $conn->begin_transaction();
            $roomId = trim($data['roomId'] ?? '');
            $staffId = trim($data['staffId'] ?? '');
            $taskTypes = trim($data['taskTypes'] ?? 'Not Specified');

            if (empty($roomId) || empty($staffId)) throw new Exception("Room ID and Staff ID are required.");

            $stmt_check = $conn->prepare("SELECT TaskID FROM pms_housekeeping_tasks WHERE RoomID = ? AND Status IN ('Pending', 'In Progress')");
            $stmt_check->bind_param("i", $roomId);
            $stmt_check->execute();
            if ($stmt_check->get_result()->num_rows > 0) throw new Exception("This room already has an active housekeeping task.");

            $stmt_insert = $conn->prepare("INSERT INTO pms_housekeeping_tasks (RoomID, UserID, AssignedUserID, TaskType, Status, DateRequested) VALUES (?, ?, ?, ?, 'Pending', NOW())");
            $stmt_insert->bind_param("iiis", $roomId, $managerUserId, $staffId, $taskTypes);
            if (!$stmt_insert->execute()) throw new Exception("Database INSERT failed: " . $stmt_insert->error);
            $taskId = $conn->insert_id;

            $stmt_status = $conn->prepare("UPDATE pms_users SET AvailabilityStatus = 'Assigned' WHERE UserID = ?");
            $stmt_status->bind_param("i", $staffId);
            $stmt_status->execute();

            // Get Details
            $stmt_info = $conn->prepare("SELECT u.Fname, u.Lname, u.EmailAddress, r.room_num as RoomNumber, r.floor_num as FloorNumber FROM pms_users u CROSS JOIN tbl_rooms r WHERE u.UserID = ? AND r.room_id = ?");
            $stmt_info->bind_param("ii", $staffId, $roomId);
            $stmt_info->execute();
            $info = $stmt_info->get_result()->fetch_assoc();

            if ($info) {
                $staffName = $info['Fname'] . ' ' . $info['Lname'];
                $staffEmail = $info['EmailAddress'];
                
                // --- RESTORED EMAIL BUTTON ---
                $taskLink = "http://localhost:3000/hk_assign_staff.html?task_id=" . $taskId;
                
                $mail->setFrom(GMAIL_EMAIL, EMAIL_FROM_NAME);
                $mail->addAddress($staffEmail, $staffName);
                $mail->Subject = 'New Housekeeping Task Assigned: Room ' . $info['RoomNumber'];
                $mail->isHTML(true);
                $mail->Body = "
                    <p>Hello $staffName,</p>
                    <p>A new housekeeping task has been assigned to you for <strong>Room " . $info['RoomNumber'] . " (Floor " . $info['FloorNumber'] . ")</strong>.</p>
                    <p><strong>Task(s):</strong> $taskTypes</p>
                    <p>Please review the task details and update the status by clicking the link below:</p>
                    <p><a href='$taskLink' style='padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;'>View Task Details</a></p>
                    <p>Thank you,<br>Housekeeping Management</p>
                ";
                $mail->send();
            }

            logHousekeepingAction($conn, $taskId, $roomId, $managerUserId, 'ASSIGNED', "Task assigned to staff ID $staffId. Tasks: $taskTypes");
            $conn->commit();
            echo json_encode(['status' => 'success', 'message' => 'Task assigned and email sent!', 'staffName' => $staffName ?? 'Staff']);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    // --- 4. CANCEL TASK ---
    case 'cancel_task':
        try {
            $conn->begin_transaction();
            $taskId = trim($data['taskId'] ?? null);
            if (empty($taskId)) throw new Exception("Task ID is required.");

            $stmt_info = $conn->prepare("SELECT RoomID, AssignedUserID, Status FROM pms_housekeeping_tasks WHERE TaskID = ?");
            $stmt_info->bind_param("i", $taskId);
            $stmt_info->execute();
            $info = $stmt_info->get_result()->fetch_assoc();

            if (!$info) throw new Exception("Task not found.");
            if ($info['Status'] !== 'Pending') throw new Exception("Only 'Pending' tasks can be cancelled.");

            $roomId = $info['RoomID'];
            $staffId = $info['AssignedUserID'];

            $stmt_update = $conn->prepare("UPDATE pms_housekeeping_tasks SET Status = 'Cancelled', Remarks = 'Cancelled by Manager' WHERE TaskID = ?");
            $stmt_update->bind_param("i", $taskId);
            $stmt_update->execute();

            if ($staffId) {
                $stmt_staff = $conn->prepare("UPDATE pms_users SET AvailabilityStatus = 'Available' WHERE UserID = ?");
                $stmt_staff->bind_param("i", $staffId);
                $stmt_staff->execute();
            }

            logHousekeepingAction($conn, $taskId, $roomId, $managerUserId, 'CANCELLED', "Task cancelled by manager.");
            $conn->commit();
            echo json_encode(['status' => 'success', 'message' => 'Housekeeping task has been cancelled.']);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;
        
    default:
        echo json_encode(['status' => 'error', 'message' => 'Unknown action.']);
        break;
}
$conn->close();
?>