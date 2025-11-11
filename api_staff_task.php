<?php
// Allow requests from your frontend development server
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

// This file ONLY connects to the DB. It does NOT check for a login session.
require_once('db_connection.php');

// *** NEW: Logging Function ***
function logMaintenanceAction($conn, $requestId, $roomId, $userId, $action, $details) {
    try {
        $stmt = $conn->prepare(
            "INSERT INTO pms.maintenance_logs (RequestID, RoomID, UserID, Action, Details) 
             VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("iiiss", $requestId, $roomId, $userId, $action, $details);
        $stmt->execute();
    } catch (Exception $e) {
        // Log the error but don't stop the main process
        error_log("Failed to log maintenance action: " . $e->getMessage());
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

    // ===== GET TASK DETAILS (for mt_assign_staff.html) =====
    case 'get_task_details':
        if (!isset($_GET['request_id'])) {
            echo json_encode(['status' => 'error', 'message' => 'Request ID missing.']);
            exit;
        }

        $requestId = (int)$_GET['request_id'];
        $response = ['status' => 'error', 'message' => 'Task not found.'];

        $sql = "SELECT 
                    mr.RequestID, mr.Status, mr.IssueType, mr.Remarks,
                    DATE_FORMAT(mr.DateRequested, '%m/%d/%Y') as DateRequested,
                    DATE_FORMAT(mr.DateRequested, '%l:%i %p') as TimeRequested,
                    r.RoomNumber, r.RoomType
                FROM 
                    pms.maintenance_requests mr
                JOIN 
                    crm.rooms r ON mr.RoomID = r.RoomID
                WHERE 
                    mr.RequestID = ?";
        
        if ($stmt = $conn->prepare($sql)) {
            $stmt->bind_param("i", $requestId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($data = $result->fetch_assoc()) {
                $response = ['status' => 'success', 'data' => $data];
            }
            $stmt->close();
        } else {
            $response['message'] = 'Database query error.';
        }
        echo json_encode($response);
        break;

    // ===== UPDATE TASK STATUS (for mt_assign_staff.html) =====
    case 'update_task_status':
        $taskData = $data['data'];
        $requestId = (int)$taskData['request_id'];
        $newStatus = $taskData['status'];
        $remarks = $taskData['remarks']; 
        $response = ['status' => 'error', 'message' => 'Failed to update status.'];

        try {
            // Start transaction
            $conn->begin_transaction();
            
            // --- Get Request Info (RoomID, AssignedUserID) ---
            $stmt_info = $conn->prepare("SELECT RoomID, AssignedUserID FROM pms.maintenance_requests WHERE RequestID = ?");
            $stmt_info->bind_param("i", $requestId);
            $stmt_info->execute();
            $result_info = $stmt_info->get_result();
            $request_data = $result_info->fetch_assoc();
            
            if (!$request_data) {
                throw new Exception("Request not found.");
            }
            
            $roomId = $request_data['RoomID'];
            $staffId = $request_data['AssignedUserID']; // This is the staff member's UserID
            $logDetails = "";

            $sql = "";
            if ($newStatus === 'Completed') {
                $sql = "UPDATE pms.maintenance_requests 
                        SET Status = ?, DateCompleted = NOW(), Remarks = ?
                        WHERE RequestID = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ssi", $newStatus, $remarks, $requestId);
                $logDetails = "Task completed by staff (ID: $staffId). Remarks: $remarks";
            
            } else { // 'In Progress'
                $sql = "UPDATE pms.maintenance_requests 
                        SET Status = ?, Remarks = ?
                        WHERE RequestID = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ssi", $newStatus, $remarks, $requestId);
                $logDetails = "Status set to 'In Progress' by staff (ID: $staffId). Remarks: $remarks";
            }
            
            $stmt->execute();

            if ($newStatus === 'Completed') {
                // --- Set staff back to 'Available' ---
                if ($staffId) {
                    $stmt_status = $conn->prepare("UPDATE pms.users SET AvailabilityStatus = 'Available' WHERE UserID = ?");
                    $stmt_status->bind_param("i", $staffId);
                    $stmt_status->execute();
                }

                // --- Get RoomNumber ---
                $stmt_room = $conn->prepare("SELECT RoomNumber FROM crm.rooms WHERE RoomID = ?");
                $stmt_room->bind_param("i", $roomId);
                $stmt_room->execute();
                $room_data = $stmt_room->get_result()->fetch_assoc();
                
                if ($room_data) {
                    $roomNumber = $room_data['RoomNumber'];
                    
                    // *** NEW: Update LastMaintenance Date ***
                    $stmt_last_maint = $conn->prepare(
                        "UPDATE pms.room_status SET LastMaintenance = NOW() WHERE RoomNumber = ?"
                    );
                    $stmt_last_maint->bind_param("s", $roomNumber);
                    $stmt_last_maint->execute();

                    // --- Check for other active tasks for this room ---
                    $stmt_check_other_tasks = $conn->prepare(
                        "SELECT COUNT(*) as active_tasks 
                         FROM pms.maintenance_requests 
                         WHERE RoomID = ? AND Status IN ('Pending', 'In Progress')"
                    );
                    $stmt_check_other_tasks->bind_param("i", $roomId);
                    $stmt_check_other_tasks->execute();
                    $result_check = $stmt_check_other_tasks->get_result()->fetch_assoc();

                    // --- Only set to Available if no other active tasks exist ---
                    if ($result_check['active_tasks'] == 0) {
                        $stmt_room_status = $conn->prepare(
                            "UPDATE pms.room_status SET RoomStatus = 'Available' WHERE RoomNumber = ?"
                        );
                        $stmt_room_status->bind_param("s", $roomNumber);
                        $stmt_room_status->execute();
                    }
                }
            }
            
            // *** ADDED: Log the action ***
            logMaintenanceAction($conn, $requestId, $roomId, $staffId, strtoupper($newStatus), $logDetails);

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