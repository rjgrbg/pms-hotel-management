<?php
// Set headers for JSON response
header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');

// 1. Include DB connection and ensure user is logged in
require_once('db_connection.php'); 

if (!isset($_SESSION['UserID']) || $_SESSION['UserType'] !== 'admin') {
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
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$response = ['success' => false, 'message' => 'Invalid action or request method.'];

// ====================================================================
// --- FETCH ROOMS (READ) ---
// Fetches details from CRM, joins Status from PMS
// ====================================================================
if ($request_method === 'GET' && $action === 'fetch_rooms') {
    
    // This query gets room details from CRM (crm.rooms)
    // and LEFT JOINS the status from PMS (pms.room_status).
    // IFNULL is used to show 'Available' for rooms not in the PMS status table.
    
    // *** ASSUMPTION ***:
    // 1. Your CRM database has a table named 'rooms'
    // 2. Your PMS database has a new table named 'room_status'
    // 3. 'crm.rooms' has: RoomID, FloorNumber, RoomNumber, RoomType, GuestCapacity, Rate
    // 4. 'pms.room_status' has: RoomNumber (UNIQUE key), RoomStatus
    
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
                // Note: We use the CRM RoomID as the primary identifier
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
// --- SET ROOM STATUS (UPDATE) ---
// This handles 'edit_room' calls from admin.js
// It only creates/updates the status in the PMS database.
// ====================================================================
} elseif ($request_method === 'POST' && $action === 'edit_room') { // MODIFIED: Removed 'add_room'
    
    // We only care about RoomNumber and RoomStatus.
    // The other fields (Type, Rate, etc.) are from CRM and not editable here.
    $number = $pms_conn->real_escape_string($_POST['roomNumber'] ?? '');
    $status = $pms_conn->real_escape_string($_POST['roomStatus'] ?? '');

    // The 'roomID' from the form is ignored, as RoomNumber is the true key.
    
    if (empty($number) || empty($status)) {
        $response['message'] = 'Missing Room Number or Status.';
    } else {
        // Use INSERT...ON DUPLICATE KEY UPDATE to create or update the status entry
        // This query assumes 'RoomNumber' is a UNIQUE key in your 'pms.room_status' table.
        $sql = "INSERT INTO room_status (RoomNumber, RoomStatus, UserID) 
                VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE RoomStatus = ?, UserID = ?";
        
        if ($stmt = $pms_conn->prepare($sql)) {
            $stmt->bind_param("ssisi", $number, $status, $user_id, $status, $user_id);
            
            if ($stmt->execute()) {
                $response['success'] = true;
                // MODIFIED: Removed 'add_room' conditional message
                $response['message'] = 'Room status updated successfully!';
            } else {
                $response['message'] = 'Failed to set room status: '. $stmt->error;
                error_log("Set room status error: ". $stmt->error);
            }
            $stmt->close();
        } else {
            $response['message'] = 'Database preparation error.';
            error_log("Set room status preparation error: ". $pms_conn->error);
        }
    }

// ====================================================================
// --- DELETE ROOM STATUS (DELETE) ---
// This removes the status from PMS, reverting it to 'Available'
// ====================================================================
} elseif ($request_method === 'POST' && $action === 'delete_room') {
    
    // In the previous step, admin.js was passing 'roomID' which came from CRM.
    // We need to fetch the RoomNumber associated with that CRM RoomID first.
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