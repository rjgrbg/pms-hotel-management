<?php
// Set headers for JSON response
header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');

// 1. Include DB connection and ensure user is logged in
require_once('db_connection.php'); 

// --- MODIFIED: Define allowed roles ---
$allowedRoles = ['admin', 'maintenance_manager'];

if (!isset($_SESSION['UserID']) || !in_array($_SESSION['UserType'], $allowedRoles)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit();
}

// --- Get BOTH database connections ---
$pms_conn = get_db_connection('pms');
$crm_conn = get_db_connection('crm');

// Check connections
if ($pms_conn === null || $crm_conn === null) {
    http_response_code(500);
    error_log("Database connection error in room_actions.php");
    echo json_encode(['success' => false, 'message' => 'Database connection error.']);
    exit();
}

$user_id = $_SESSION['UserID'];
$request_method = $_SERVER['REQUEST_METHOD'];
$response = ['success' => false, 'message' => 'Invalid action or request method.'];
$action = '';

// --- MODIFIED: Handle JSON payload for POST/PUT ---
$data = [];
if ($request_method === 'POST' || $request_method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        $data = []; // Not valid JSON, fall back to POST
    }
}

// --- MODIFIED: Determine action from GET, POST, or JSON body ---
$action = $_GET['action'] ?? $_POST['action'] ?? $data['action'] ?? '';


// ====================================================================
// --- FETCH ROOMS (READ) ---
// Fetches details from CRM, joins Status from PMS
// ====================================================================
if ($request_method === 'GET' && $action === 'fetch_rooms') {
    
    $sql = "SELECT 
                c.RoomID, 
                c.FloorNumber, 
                c.RoomNumber, 
                c.RoomType,
                c.GuestCapacity,
                c.Rate,
                IFNULL(p.RoomStatus, 'Available') AS RoomStatus
            FROM 
                crm.rooms c
            LEFT JOIN 
                pms.room_status p ON c.RoomNumber = p.RoomNumber
            ORDER BY 
                c.RoomNumber ASC";

    if ($result = $crm_conn->query($sql)) {
        $rooms = [];
        while ($row = $result->fetch_assoc()) {
            $rooms[] = [
                'RoomID' => $row['RoomID'], 
                'Floor' => $row['FloorNumber'],
                'Room' => $row['RoomNumber'],
                'Type' => $row['RoomType'],
                'NoGuests' => $row['GuestCapacity'],
                'Rate' => $row['Rate'],
                'Status' => $row['RoomStatus'],
            ];
        }
        $response['success'] = true;
        $response['data'] = $rooms;
        $response['totalRecords'] = count($rooms);
    } else {
        $response['message'] = "Error fetching rooms: ". $crm_conn->error;
        error_log("Room fetch error: ". $crm_conn->error);
    }

// ====================================================================
// --- NEW: SET ROOM STATUS (from maintenance.js) ---
// This handles 'update_status' calls from maintenance.js (JSON)
// ====================================================================
} elseif ($request_method === 'POST' && $action === 'update_status') {
    
    $number = $pms_conn->real_escape_string($data['room_number'] ?? '');
    $status = $pms_conn->real_escape_string($data['new_status'] ?? '');

    if (empty($number) || empty($status)) {
        $response['message'] = 'Missing Room Number or New Status from JSON body.';
    } else {
        // Use INSERT...ON DUPLICATE KEY UPDATE
        $sql = "INSERT INTO room_status (RoomNumber, RoomStatus, UserID) 
                VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE RoomStatus = ?, UserID = ?";
        
        if ($stmt = $pms_conn->prepare($sql)) {
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
            error_log("Set room status prep error (update_status): ". $pms_conn->error);
        }
    }

// ====================================================================
// --- SET ROOM STATUS (from admin.js) ---
// This handles 'edit_room' calls from admin.js (Form Data)
// ====================================================================
} elseif ($request_method === 'POST' && $action === 'edit_room') { 
    
    $number = $pms_conn->real_escape_string($_POST['roomNumber'] ?? '');
    $status = $pms_conn->real_escape_string($_POST['roomStatus'] ?? '');
    
    if (empty($number) || empty($status)) {
        $response['message'] = 'Missing Room Number or Status from POST data.';
    } else {
        // Use INSERT...ON DUPLICATE KEY UPDATE
        $sql = "INSERT INTO room_status (RoomNumber, RoomStatus, UserID) 
                VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE RoomStatus = ?, UserID = ?";
        
        if ($stmt = $pms_conn->prepare($sql)) {
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
            error_log("Set room status preparation error (edit_room): ". $pms_conn->error);
        }
    }

// ====================================================================
// --- DELETE ROOM STATUS (DELETE) ---
// This removes the status from PMS, reverting it to 'Available'
// ====================================================================
} elseif ($request_method === 'POST' && $action === 'delete_room') {
    
    // This action still expects POST form data
    $room_id = $crm_conn->real_escape_string($_POST['roomID'] ?? '');

    if (empty($room_id)) {
        $response['message'] = 'Missing Room ID.';
    } else {
        // 1. Find the RoomNumber from CRM using the RoomID
        $roomNumber = null;
        $stmt_find = $crm_conn->prepare("SELECT RoomNumber FROM crm.rooms WHERE RoomID = ?");
        $stmt_find->bind_param("i", $room_id);
        if ($stmt_find->execute()) {
            $result = $stmt_find->get_result();
            if ($row = $result->fetch_assoc()) {
                $roomNumber = $row['RoomNumber'];
            }
        }
        $stmt_find->close();

        if ($roomNumber) {
            // 2. Delete the status entry from PMS using the RoomNumber
            $sql = "DELETE FROM pms.room_status WHERE RoomNumber = ?";
            
            if ($stmt = $pms_conn->prepare($sql)) {
                $stmt->bind_param("s", $roomNumber);
                
                if ($stmt->execute()) {
                    $response['success'] = true;
                    $response['message'] = 'Room status reset successfully (removed from PMS).';
                } else {
                    $response['message'] = 'Failed to delete room status: '. $stmt->error;
                    error_log("Delete room status error: ". $stmt->error);
                }
                $stmt->close();
            } else {
                $response['message'] = 'Database preparation error (PMS).';
                error_log("Delete room status prep error: ". $pms_conn->error);
            }
        } else {
            $response['message'] = 'Room not found in CRM.';
        }
    }
}

$pms_conn->close();
$crm_conn->close();
echo json_encode($response);
exit();
?>