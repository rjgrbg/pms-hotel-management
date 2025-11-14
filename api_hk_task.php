<?php
// Allow requests from your frontend development server
header("Access-Control-Allow-Origin: *"); // Allow all for simplicity, or lock to your dev server
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

// This file ONLY connects to the DB. It does NOT check for a login session.
require_once('db_connection.php');

// Get single database connection
$conn = get_db_connection('pms');

if ($conn === null) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection error.']);
    exit;
}

// *** Logging Function ***
function logHousekeepingAction($conn, $taskId, $roomId, $userId, $action, $details) {
    try {
        $stmt = $conn->prepare(
            "INSERT INTO pms_housekeeping_logs (TaskID, RoomID, UserID, Action, Details) 
             VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("iiiss", $taskId, $roomId, $userId, $action, $details);
        $stmt->execute();
    } catch (Exception $e) {
        // Log the error but don't stop the main process
        error_log("Failed to log housekeeping action: " . $e->getMessage());
    }
}
// ===== END OF HELPER FUNCTION =====


// Get the incoming JSON data
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    // Allow GET requests for fetching details
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
        $action = $_GET['action'];
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid request.']);
        exit;
    }
} else {
    $action = $data['action'];
}

switch ($action) {

    // ===== GET TASK DETAILS (for hk_assign_staff.html) =====
    case 'get_task_details':
        if (!isset($_GET['task_id'])) {
            echo json_encode(['status' => 'error', 'message' => 'Task ID missing.']);
            exit;
        }

        $taskId = (int)$_GET['task_id'];
        $response = ['status' => 'error', 'message' => 'Task not found.']; // Default error

        // UPDATED: Query from single database with new table/column names
        $sql = "SELECT 
                    ht.TaskID, ht.Status, ht.TaskType, ht.Remarks,
                    DATE_FORMAT(ht.DateRequested, '%m/%d/%Y') as DateRequested,
                    DATE_FORMAT(ht.DateRequested, '%l:%i %p') as TimeRequested,
                    r.room_num as RoomNumber, r.room_type as RoomType
                FROM 
                    pms_housekeeping_tasks ht
                JOIN 
                    pms_rooms r ON ht.RoomID = r.room_id
                WHERE 
                    ht.TaskID = ? AND ht.Status IN ('Pending', 'In Progress')";
        
        if ($stmt = $conn->prepare($sql)) {
            $stmt->bind_param("i", $taskId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($data = $result->fetch_assoc()) {
                $response = ['status' => 'success', 'data' => $data];
            } else {
                $response['message'] = 'Task not found, or it is already completed/cancelled.';
            }
            $stmt->close();
        } else {
            $response['message'] = 'Database query error.';
        }
        echo json_encode($response);
        break;

    // ===== UPDATE TASK STATUS (for hk_assign_staff.html) =====
    case 'update_task_status':
        $taskData = $data['data'];
        $taskId = (int)$taskData['task_id'];
        $newStatus = $taskData['status'];
        $remarks = $taskData['remarks']; 
        $response = ['status' => 'error', 'message' => 'Failed to update status.'];

        try {
            // Start transaction
            $conn->begin_transaction();
            
            // --- Get Task Info (RoomID, AssignedUserID) ---
            $stmt_info = $conn->prepare("SELECT RoomID, AssignedUserID FROM pms_housekeeping_tasks WHERE TaskID = ?");
            $stmt_info->bind_param("i", $taskId);
            $stmt_info->execute();
            $result_info = $stmt_info->get_result();
            $task_data = $result_info->fetch_assoc();
            
            if (!$task_data) {
                throw new Exception("Task not found.");
            }
            
            $roomId = $task_data['RoomID'];
            $staffId = $task_data['AssignedUserID']; // This is the staff member's UserID
            $logDetails = "";

            $sql = "";
            if ($newStatus === 'Completed') {
                $sql = "UPDATE pms_housekeeping_tasks 
                        SET Status = ?, DateCompleted = NOW(), Remarks = ?
                        WHERE TaskID = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ssi", $newStatus, $remarks, $taskId);
                $logDetails = "Task completed by staff (ID: $staffId). Remarks: $remarks";
            
            } else { // 'In Progress'
                $sql = "UPDATE pms_housekeeping_tasks 
                        SET Status = ?, Remarks = ?
                        WHERE TaskID = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ssi", $newStatus, $remarks, $taskId);
                $logDetails = "Status set to 'In Progress' by staff (ID: $staffId). Remarks: $remarks";
            }
            
            $stmt->execute();

            if ($newStatus === 'Completed') {
                // --- Set staff back to 'Available' ---
                if ($staffId) {
                    $stmt_status = $conn->prepare("UPDATE pms_users SET AvailabilityStatus = 'Available' WHERE UserID = ?");
                    $stmt_status->bind_param("i", $staffId);
                    $stmt_status->execute();
                }

                // --- Get RoomNumber (UPDATED: using room_num from pms_rooms) ---
                $stmt_room = $conn->prepare("SELECT room_num FROM pms_rooms WHERE room_id = ?");
                $stmt_room->bind_param("i", $roomId);
                $stmt_room->execute();
                $room_data = $stmt_room->get_result()->fetch_assoc();
                
                if ($room_data) {
                    $roomNumber = $room_data['room_num'];
                    
                    // *** Update LastClean Date ***
                    $stmt_last_clean = $conn->prepare(
                        "UPDATE pms_room_status SET LastClean = NOW() WHERE RoomNumber = ?"
                    );
                    $stmt_last_clean->bind_param("i", $roomNumber);
                    $stmt_last_clean->execute();

                    // --- Check for other active tasks for this room ---
                    $stmt_check_other_tasks = $conn->prepare(
                        "SELECT COUNT(*) as active_tasks 
                         FROM pms_housekeeping_tasks 
                         WHERE RoomID = ? AND Status IN ('Pending', 'In Progress')"
                    );
                    $stmt_check_other_tasks->bind_param("i", $roomId);
                    $stmt_check_other_tasks->execute();
                    $result_check = $stmt_check_other_tasks->get_result()->fetch_assoc();

                    // --- Only set to Available if no other active tasks exist ---
                    if ($result_check['active_tasks'] == 0) {
                        $stmt_room_status = $conn->prepare(
                            "UPDATE pms_room_status SET RoomStatus = 'Available' WHERE RoomNumber = ?"
                        );
                        $stmt_room_status->bind_param("i", $roomNumber);
                        $stmt_room_status->execute();
                    }
                }
            }
            
            // *** Log the action ***
            logHousekeepingAction($conn, $taskId, $roomId, $staffId, strtoupper($newStatus), $logDetails);

            // Commit transaction
            $conn->commit();
                
            $response = ['status' => 'success', 'message' => 'Status updated.'];

        } catch (Exception $e) {
            $conn->rollback();
            $response['message'] = $e->getMessage();
        }
        
        echo json_encode($response);
        break;
        
    default:
        echo json_encode(['status' => 'error', 'message' => 'Unknown action.']);
        break;
}

$conn->close();
?>