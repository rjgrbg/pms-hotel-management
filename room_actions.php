
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

$user_id = $_SESSION['UserID'];
$request_method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$response = ['success' => false, 'message' => 'Invalid action or request method.'];

// Function to sanitize input
function sanitize_input($conn, $data) {
    if (is_array($data)) {
        return array_map(function($item) use ($conn) {
            return $conn->real_escape_string($item);
        }, $data);
    }
    return $conn->real_escape_string($data);
}

// ====================================================================
// --- FETCH ROOMS (READ) ---
// ====================================================================
if ($request_method === 'GET' && $action === 'fetch_rooms') {
    $sql = "SELECT 
                RoomID, 
                FloorNumber, 
                RoomNumber, 
                RoomType,
                GuestCapacity,
                Rate,
                RoomStatus
            FROM room
            ORDER BY RoomNumber ASC";

    if ($result = $conn->query($sql)) {
        $rooms = [];
        while ($row = $result->fetch_assoc()) {
            $rooms[] = [
                'RoomID' => $row['RoomID'],
                'Floor' => $row['FloorNumber'],
                'Room' => $row['RoomNumber'],
                'Type' => $row['RoomType'],
                'NoGuests' => $row['GuestCapacity'],
                'Rate' => $row['Rate'], // Store as raw number for easy editing
                'Status' => $row['RoomStatus'],
            ];
        }
        $response['success'] = true;
        $response['data'] = $rooms;
        $response['totalRecords'] = count($rooms);
    } else {
        $response['message'] = "Error fetching rooms: " . $conn->error;
        error_log("Room fetch error: " . $conn->error);
    }

// ====================================================================
// --- ADD ROOM (CREATE) ---
// ====================================================================
} elseif ($request_method === 'POST' && $action === 'add_room') {
    // Sanitize and validate inputs
    $floor = sanitize_input($conn, $_POST['roomFloor'] ?? '');
    $number = sanitize_input($conn, $_POST['roomNumber'] ?? '');
    $type = sanitize_input($conn, $_POST['roomType'] ?? '');
    $guests = sanitize_input($conn, $_POST['roomGuests'] ?? '');
    $rate = sanitize_input($conn, $_POST['roomRate'] ?? '');
    $status = sanitize_input($conn, $_POST['roomStatus'] ?? '');
    
    if (empty($floor) || empty($number) || empty($type) || empty($guests) || empty($rate) || empty($status)) {
        $response['message'] = 'Missing required fields.';
    } else {
        $sql = "INSERT INTO room (UserID, RoomNumber, RoomType, GuestCapacity, Rate, RoomStatus, FloorNumber) VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        // Use 'd' for DECIMAL (Rate)
        if ($stmt = $conn->prepare($sql)) {
            $stmt->bind_param("isssdsi", $user_id, $number, $type, $guests, $rate, $status, $floor);
            
            if ($stmt->execute()) {
                $response['success'] = true;
                $response['message'] = 'Room added successfully!';
            } else {
                if ($conn->errno == 1062) {
                    $response['message'] = 'Error: Room number ' . $number . ' already exists.';
                } else {
                    $response['message'] = 'Failed to add room: ' . $stmt->error;
                    error_log("Add room error: " . $stmt->error);
                }
            }
            $stmt->close();
        } else {
            $response['message'] = 'Database preparation error.';
            error_log("Add room preparation error: " . $conn->error);
        }
    }

// ====================================================================
// --- EDIT ROOM (UPDATE) ---
// ====================================================================
} elseif ($request_method === 'POST' && $action === 'edit_room') {
    $room_id = sanitize_input($conn, $_POST['roomID'] ?? '');
    $floor = sanitize_input($conn, $_POST['roomFloor'] ?? '');
    $number = sanitize_input($conn, $_POST['roomNumber'] ?? '');
    $type = sanitize_input($conn, $_POST['roomType'] ?? '');
    $guests = sanitize_input($conn, $_POST['roomGuests'] ?? '');
    $rate = sanitize_input($conn, $_POST['roomRate'] ?? '');
    $status = sanitize_input($conn, $_POST['roomStatus'] ?? '');


    if (empty($room_id) || empty($floor) || empty($number) || empty($type) || empty($guests) || empty($rate) || empty($status)) {
        $response['message'] = 'Missing required fields.';
    } else {
        // Updated UserID to the currently logged-in admin (good practice)
        $sql = "UPDATE room SET RoomNumber = ?, RoomType = ?, GuestCapacity = ?, Rate = ?, RoomStatus = ?, FloorNumber = ?, UserID = ? WHERE RoomID = ?";
        
        if ($stmt = $conn->prepare($sql)) {
            $stmt->bind_param("issdsiii", $number, $type, $guests, $rate, $status, $floor, $user_id, $room_id);
            
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    $response['success'] = true;
                    $response['message'] = 'Room updated successfully!';
                } else {
                    $response['message'] = 'Room not found or no changes were made.';
                }
            } else {
                 if ($conn->errno == 1062) {
                    $response['message'] = 'Error: Room number ' . $number . ' already exists.';
                } else {
                    $response['message'] = 'Failed to update room: ' . $stmt->error;
                    error_log("Edit room error: " . $stmt->error);
                }
            }
            $stmt->close();
        } else {
            $response['message'] = 'Database preparation error.';
            error_log("Edit room preparation error: " . $conn->error);
        }
    }

// ====================================================================
// --- DELETE ROOM (DELETE) ---
// ====================================================================
} elseif ($request_method === 'POST' && $action === 'delete_room') {
    $room_id = sanitize_input($conn, $_POST['roomID'] ?? '');

    if (empty($room_id)) {
        $response['message'] = 'Missing Room ID.';
    } else {
        $sql = "DELETE FROM room WHERE RoomID = ?";
        
        if ($stmt = $conn->prepare($sql)) {
            $stmt->bind_param("i", $room_id);
            
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    $response['success'] = true;
                    $response['message'] = 'Room deleted successfully.';
                } else {
                    $response['message'] = 'Room not found.';
                }
            } else {
                $response['message'] = 'Failed to delete room: ' . $stmt->error;
                error_log("Delete room error: " . $stmt->error);
            }
            $stmt->close();
        } else {
            $response['message'] = 'Database preparation error.';
            error_log("Delete room preparation error: " . $conn->error);
        }
    }
}

$conn->close();
echo json_encode($response);
exit();
?>