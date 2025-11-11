<?php
// Allow requests from your frontend development server
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

// This file ONLY connects to the DB. It does NOT check for a login session.
require_once('db_connection.php');

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

            $sql = "";
            if ($newStatus === 'Completed') {
                $sql = "UPDATE pms.maintenance_requests 
                        SET Status = ?, DateCompleted = NOW(), Remarks = ?
                        WHERE RequestID = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ssi", $newStatus, $remarks, $requestId);
            
            } else {
                $sql = "UPDATE pms.maintenance_requests 
                        SET Status = ?, Remarks = ?
                        WHERE RequestID = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ssi", $newStatus, $remarks, $requestId);
            }
            
            $stmt->execute();

            if ($newStatus === 'Completed') {
                // --- Set staff back to 'Available' ---
                // *** MODIFIED: Also select RoomID ***
                $stmt_user = $conn->prepare("SELECT AssignedUserID, RoomID FROM pms.maintenance_requests WHERE RequestID = ?");
                $stmt_user->bind_param("i", $requestId);
                $stmt_user->execute();
                $result_user = $stmt_user->get_result();
                $request_data = $result_user->fetch_assoc();
                
                $staffId = $request_data['AssignedUserID'];
                $roomId = $request_data['RoomID']; // Get the RoomID from the completed task

                if ($staffId) {
                    $stmt_status = $conn->prepare("UPDATE pms.users SET AvailabilityStatus = 'Available' WHERE UserID = ?");
                    $stmt_status->bind_param("i", $staffId);
                    $stmt_status->execute();
                }

                // *** ADDED: Set room status back to 'Available' ***
                if ($roomId) {
                    // 1. Get RoomNumber from RoomID
                    $stmt_room = $conn->prepare("SELECT RoomNumber FROM crm.rooms WHERE RoomID = ?");
                    $stmt_room->bind_param("i", $roomId);
                    $stmt_room->execute();
                    $result_room = $stmt_room->get_result();
                    $room_data = $result_room->fetch_assoc();
                    
                    if ($room_data) {
                        $roomNumber = $room_data['RoomNumber'];
                        
                        // 2. Check for any OTHER active tasks for this room
                        $stmt_check_other_tasks = $conn->prepare(
                            "SELECT COUNT(*) as active_tasks 
                             FROM pms.maintenance_requests 
                             WHERE RoomID = ? AND Status IN ('Pending', 'In Progress')"
                        );
                        $stmt_check_other_tasks->bind_param("i", $roomId);
                        $stmt_check_other_tasks->execute();
                        $result_check = $stmt_check_other_tasks->get_result()->fetch_assoc();

                        // 3. Only set to Available if no other active tasks exist
                        if ($result_check['active_tasks'] == 0) {
                            $stmt_room_status = $conn->prepare(
                                "UPDATE pms.room_status SET RoomStatus = 'Available' WHERE RoomNumber = ?"
                            );
                            $stmt_room_status->bind_param("s", $roomNumber);
                            $stmt_room_status->execute();
                        }
                    }
                }
                // *** END OF NEW LOGIC ***
            }

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