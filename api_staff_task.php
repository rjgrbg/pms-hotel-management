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
        // This action is called via GET, so we use $_GET
        if (!isset($_GET['request_id'])) {
            echo json_encode(['status' => 'error', 'message' => 'Request ID missing.']);
            exit;
        }

        $requestId = (int)$_GET['request_id'];
        $response = ['status' => 'error', 'message' => 'Task not found.'];

        $sql = "SELECT 
                    mr.RequestID, mr.Status,
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
        // This action is called via POST with JSON data
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
                // If "Completed", update all fields
                $workType = $taskData['workType'];
                $unitType = $taskData['unitType'];
                $workDescription = $taskData['workDescription'];

                $sql = "UPDATE pms.maintenance_requests 
                        SET Status = ?, Remarks = ?, DateCompleted = NOW(), 
                            WorkType = ?, UnitType = ?, WorkDescription = ?
                        WHERE RequestID = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("sssssi", $newStatus, $remarks, $workType, $unitType, $workDescription, $requestId);
            
            } else {
                // If "In Progress", just update status and remarks
                $sql = "UPDATE pms.maintenance_requests 
                        SET Status = ?, Remarks = ?
                        WHERE RequestID = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ssi", $newStatus, $remarks, $requestId);
            }
            
            $stmt->execute();

            if ($newStatus === 'Completed') {
                // --- Set staff back to 'Available' ---
                $stmt_user = $conn->prepare("SELECT AssignedUserID FROM pms.maintenance_requests WHERE RequestID = ?");
                $stmt_user->bind_param("i", $requestId);
                $stmt_user->execute();
                $result_user = $stmt_user->get_result();
                $request_data = $result_user->fetch_assoc();
                $staffId = $request_data['AssignedUserID'];

                if ($staffId) {
                    $stmt_status = $conn->prepare("UPDATE pms.users SET AvailabilityStatus = 'Available' WHERE UserID = ?");
                    $stmt_status->bind_param("i", $staffId);
                    $stmt_status->execute();
                }
            }

            // Commit transaction
            $conn->commit();
                
            // ===== THIS IS THE CORRECTED LINE =====
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