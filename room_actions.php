<?php
// Set headers for JSON response
header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');

// 1. Include DB connection and ensure user is logged in
session_start(); // <-- Make sure session is started before accessing $_SESSION
require_once('db_connection.php'); 

// Define allowed roles
$allowedRoles = ['admin', 'maintenance_manager', 'housekeeping_manager'];

if (!isset($_SESSION['UserID']) || !in_array($_SESSION['UserType'], $allowedRoles)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit();
}

// Get single database connection
$conn = get_db_connection('pms');

// Check connection
if ($conn === null) {
    http_response_code(500);
    error_log("Database connection error in room_actions.php");
    echo json_encode(['success' => false, 'message' => 'Database connection error.']);
    exit();
}

$user_id = $_SESSION['UserID'];
$request_method = $_SERVER['REQUEST_METHOD'];
$response = ['success' => false, 'message' => 'Invalid action or request method.'];
$action = '';

// Handle JSON payload for POST/PUT
$data = [];
if ($request_method === 'POST' || $request_method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        $data = []; // Not valid JSON, fall back to POST
    }
}

// Determine action from GET, POST, or JSON body
// --- REFINEMENT: Added trim() ---
$action = trim($_GET['action'] ?? $_POST['action'] ?? $data['action'] ?? '');


// ====================================================================
// --- FETCH ROOMS (READ) ---
// ====================================================================
if ($request_method === 'GET' && $action === 'fetch_rooms') {
    
    // This query has no user input, so it's already safe.
    $sql = "SELECT 
                r.room_id, 
                r.floor_num, 
                r.room_num, 
                r.room_type,
                r.capacity,
                r.price,
                IFNULL(rs.RoomStatus, 'Available') AS RoomStatus
            FROM 
                tbl_rooms r
            LEFT JOIN 
                pms_room_status rs ON r.room_num = rs.RoomNumber
            WHERE
                r.is_archived = 0
            ORDER BY 
                r.room_num ASC";

    if ($result = $conn->query($sql)) {
        $rooms = [];
        while ($row = $result->fetch_assoc()) {
            $rooms[] = [
                'RoomID' => $row['room_id'], 
                'Floor' => $row['floor_num'],
                'Room' => $row['room_num'],
                'Type' => $row['room_type'],
                'NoGuests' => $row['capacity'],
                'Rate' => $row['price'],
                'Status' => $row['RoomStatus'],
            ];
        }
        $response['success'] = true;
        $response['data'] = $rooms;
        $response['totalRecords'] = count($rooms);
    } else {
        $response['message'] = "Error fetching rooms: ". $conn->error;
        error_log("Room fetch error: ". $conn->error);
    }

// ====================================================================
// --- SET ROOM STATUS (from maintenance.js) ---
// ====================================================================
} elseif ($request_method === 'POST' && $action === 'update_status') {
    
    // --- REFINEMENT: Replaced real_escape_string with trim() ---
    $number = trim($data['room_number'] ?? '');
    $status = trim($data['new_status'] ?? '');

    if (empty($number) || empty($status)) {
        $response['message'] = 'Missing Room Number or New Status from JSON body.';
    } else {
        
        // Security Check: Prevent setting to 'Available' if active tasks exist
        if ($status === 'Available') {
            // 1. Get room_id from tbl_rooms
            // Using prepared statements, so no escaping is needed on $number
            $stmt_room = $conn->prepare("SELECT room_id FROM tbl_rooms WHERE room_num = ?");
            $stmt_room->bind_param("s", $number); // Use "s" for string since it was trimmed
            $stmt_room->execute();
            $room_result = $stmt_room->get_result();
            
            if ($room_row = $room_result->fetch_assoc()) {
                $roomId = $room_row['room_id'];
                
                // 2. Check for active maintenance tasks
                $stmt_check = $conn->prepare("SELECT COUNT(*) as active_tasks FROM pms_maintenance_requests WHERE RoomID = ? AND Status IN ('Pending', 'In Progress')");
                $stmt_check->bind_param("i", $roomId); // $roomId is from our DB, safe
                $stmt_check->execute();
                $task_result = $stmt_check->get_result()->fetch_assoc();
                
                if ($task_result && $task_result['active_tasks'] > 0) {
                    $response['success'] = false;
                    $response['message'] = "Cannot set status to 'Available' because an active maintenance task (Pending or In Progress) exists for this room.";
                    
                    $stmt_room->close();
                    $stmt_check->close();
                    $conn->close();
                    echo json_encode($response);
                    exit();
                }
                $stmt_check->close();
            }
            $stmt_room->close();
        }

        // Use INSERT...ON DUPLICATE KEY UPDATE
        $sql = "INSERT INTO pms_room_status (RoomNumber, RoomStatus, UserID) 
                VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE RoomStatus = ?, UserID = ?";
        
        if ($stmt = $conn->prepare($sql)) {
            // Pass the trimmed $number and $status directly
            $stmt->bind_param("ssisi", $number, $status, $user_id, $status, $user_id);
            
            if ($stmt->execute()) {
                $response['success'] = true;
                $response['message'] = 'Room status updated successfully!';
            } else {
                $response['message'] = 'Failed to set room status: '. $stmt->error;
                error_log("Set room status error (update_status): ". $stmt->error);
            }
            $stmt->close();
        } else {
            $response['message'] = 'Database preparation error.';
            error_log("Set room status prep error (update_status): ". $conn->error);
        }
    }

// ====================================================================
// --- SET ROOM STATUS (from admin.js) ---
// ====================================================================
} elseif ($request_method === 'POST' && $action === 'edit_room') { 
    
    // --- REFINEMENT: Replaced real_escape_string with trim() ---
    $number = trim($_POST['roomNumber'] ?? '');
    $status = trim($_POST['roomStatus'] ?? '');
    
    if (empty($number) || empty($status)) {
        $response['message'] = 'Missing Room Number or Status from POST data.';
    } else {

        // Security Check: (This logic is identical to 'update_status')
        if ($status === 'Available') { 
            $stmt_room = $conn->prepare("SELECT room_id FROM tbl_rooms WHERE room_num = ?");
            $stmt_room->bind_param("s", $number); // Use "s" for string
            $stmt_room->execute();
            $room_result = $stmt_room->get_result();
            
            if ($room_row = $room_result->fetch_assoc()) {
                $roomId = $room_row['room_id'];
                
                $stmt_check = $conn->prepare("SELECT COUNT(*) as active_tasks FROM pms_maintenance_requests WHERE RoomID = ? AND Status IN ('Pending', 'In Progress')");
                $stmt_check->bind_param("i", $roomId);
                $stmt_check->execute();
                $task_result = $stmt_check->get_result()->fetch_assoc();
                
                if ($task_result && $task_result['active_tasks'] > 0) {
                    $response['success'] = false;
                    $response['message'] = "Cannot set status to 'Available' because an active maintenance task (Pending or In Progress) exists for this room.";
                    
                    $stmt_room->close();
                    $stmt_check->close();
                    $conn->close();
                    echo json_encode($response);
                    exit();
                }
                $stmt_check->close();
            }
            $stmt_room->close();
        }

        // Use INSERT...ON DUPLICATE KEY UPDATE
        $sql = "INSERT INTO pms_room_status (RoomNumber, RoomStatus, UserID) 
                VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE RoomStatus = ?, UserID = ?";
        
        if ($stmt = $conn->prepare($sql)) {
            // Pass the trimmed $number and $status directly
            $stmt->bind_param("ssisi", $number, $status, $user_id, $status, $user_id);
            
            if ($stmt->execute()) {
                $response['success'] = true;
                $response['message'] = 'Room status updated successfully!';
            } else {
                $response['message'] = 'Failed to set room status: '. $stmt->error;
                error_log("Set room status error (edit_room): ". $stmt->error);
            }
            $stmt->close();
        } else {
            $response['message'] = 'Database preparation error.';
            error_log("Set room status preparation error (edit_room): ". $conn->error);
        }
    }

// ====================================================================
// --- DELETE ROOM STATUS (DELETE) ---
// ====================================================================
} elseif ($request_method === 'POST' && $action === 'delete_room') {
    
    // --- REFINEMENT: Replaced real_escape_string with trim() ---
    $room_id = trim($_POST['roomID'] ?? '');

    if (empty($room_id)) {
        $response['message'] = 'Missing Room ID.';
    } else {
        // 1. Find the room_num from tbl_rooms using the room_id
        $roomNumber = null;
        $stmt_find = $conn->prepare("SELECT room_num FROM tbl_rooms WHERE room_id = ?");
        $stmt_find->bind_param("s", $room_id); // Use "s" for string
        if ($stmt_find->execute()) {
            $result = $stmt_find->get_result();
            if ($row = $result->fetch_assoc()) {
                $roomNumber = $row['room_num'];
            }
        }
        $stmt_find->close();

        if ($roomNumber) {
            // 2. Delete the status entry from pms_room_status
            $sql = "DELETE FROM pms_room_status WHERE RoomNumber = ?";
            
            if ($stmt = $conn->prepare($sql)) {
                $stmt->bind_param("s", $roomNumber); // $roomNumber is from DB, safe
                
                if ($stmt->execute()) {
                    $response['success'] = true;
                    $response['message'] = 'Room status reset successfully (removed from status table).';
                } else {
                    $response['message'] = 'Failed to delete room status: '. $stmt->error;
                    error_log("Delete room status error: ". $stmt->error);
                }
                $stmt->close();
            } else {
                $response['message'] = 'Database preparation error.';
                error_log("Delete room status prep error: ". $conn->error);
            }
        } else {
            $response['message'] = 'Room not found.';
        }
    }
}

$conn->close();
echo json_encode($response);
exit();
?>