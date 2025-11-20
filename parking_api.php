<?php
// pms-hotel-management/parking_api.php

// 1. Include necessary files
require_once('db_connection.php'); // For the $conn database connection
require_once('user.php'); // For getting the logged-in user's ID

// 2. Start the session
if (session_status() == PHP_SESSION_NONE) {
    session_start([
        'cookie_httponly' => true,
        'cookie_secure' => isset($_SERVER['HTTPS']),
        'use_strict_mode' => true
    ]);
}

// 3. Get the database connection
$conn = get_db_connection('b9wkqgu32onfqy0dvyva');
if (!$conn) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed.']);
    exit;
}

// 4. A router to handle different actions
$action = $_POST['action'] ?? $_GET['action'] ?? '';
header('Content-Type: application/json'); // Set the header for all responses

// 5. Check login status for all actions
$staffID = $_SESSION['UserID'] ?? null;
if (!$staffID) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'error' => 'User not logged in or session expired.']);
    $conn->close();
    exit;
}


switch ($action) {
    case 'enterVehicle':
        handleEnterVehicle($conn, $staffID);
        break;
    case 'exitVehicle':
        handleExitVehicle($conn, $staffID);
        break;
    case 'getVehicleTypes':
        handleGetVehicleTypes($conn);
        break;
    case 'getVehicleCategories':
        handleGetVehicleCategories($conn);
        break;
    case 'getAvailableSlots':
        handleGetAvailableSlots($conn);
        break;
    case 'getDashboardData':
        handleGetDashboardData($conn);
        break;
    case 'getAllSlots':
        handleGetAllSlots($conn);
        break;
    case 'getVehiclesIn':
        handleGetVehiclesIn($conn);
        break;
    case 'getHistory':
        handleGetHistory($conn);
        break;
    case 'getParkingAreas':
        handleGetParkingAreas($conn);
        break;
    
    // --- (1) NEW CASE ADDED HERE ---
    case 'getGuests':
        handleGetGuests($conn);
        break;
    // --- END OF NEW CASE ---
        
    case 'updateUser':
        handleUpdateUser($conn, $staffID);
        break;
    
    default:
        http_response_code(400); // Bad Request
        echo json_encode(['success' => false, 'error' => "Invalid action: $action"]);
}

$conn->close();
exit;

// --- FUNCTION DEFINITIONS ---

function handleEnterVehicle($conn, $staffID) {
    // StaffID is already available from the session check
    $slotID = $_POST['slotID'] ?? null;
    $plateNumber = $_POST['plateNumber'] ?? null;
    $guestName = $_POST['guestName'] ?? '';
    $roomNumber = $_POST['roomNumber'] ?? '';
    $vehicleTypeID = $_POST['vehicleTypeID'] ?? null;
    $vehicleCategoryID = $_POST['vehicleCategoryID'] ?? null;
    
    if (!$slotID || !$plateNumber || !$vehicleTypeID || !$vehicleCategoryID) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing required fields.']);
        exit;
    }
    
    $conn->begin_transaction();
    try {
        // Check if slot is still available
        $stmt_check = $conn->prepare("SELECT Status FROM pms_parkingslot WHERE SlotID = ?");
        $stmt_check->bind_param("i", $slotID);
        $stmt_check->execute();
        $slotStatus = $stmt_check->get_result()->fetch_assoc()['Status'] ?? null;

        if ($slotStatus !== 'available') {
             throw new Exception("Slot is no longer available. Please refresh.");
        }

        $sql_insert = "INSERT INTO pms_parking_sessions (SlotID, PlateNumber, GuestName, RoomNumber, VehicleTypeID, VehicleCategoryID, EntryTime, StaffID_Entry) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)";
        $stmt_insert = $conn->prepare($sql_insert);
        $stmt_insert->bind_param("isssiis", $slotID, $plateNumber, $guestName, $roomNumber, $vehicleTypeID, $vehicleCategoryID, $staffID);
        $stmt_insert->execute();
        
        $sql_update = "UPDATE pms_parkingslot SET Status = 'occupied' WHERE SlotID = ?";
        $stmt_update = $conn->prepare($sql_update);
        $stmt_update->bind_param("i", $slotID);
        $stmt_update->execute();
        
        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Vehicle entered successfully!']);
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function handleExitVehicle($conn, $staffID) {
    // $staffID could be used to log who exited the vehicle
    $sessionID = $_POST['sessionID'] ?? null;
    $slotID = $_POST['slotID'] ?? null;
    if (!$sessionID || !$slotID) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing SessionID or SlotID.']);
        exit;
    }
    
    $conn->begin_transaction();
    try {
        $sql_update_session = "UPDATE pms_parking_sessions SET ExitTime = NOW() WHERE SessionID = ? AND ExitTime IS NULL";
        $stmt_session = $conn->prepare($sql_update_session);
        $stmt_session->bind_param("i", $sessionID);
        $stmt_session->execute();

        if ($stmt_session->affected_rows === 0) {
            throw new Exception("Vehicle already exited or not found.");
        }

        $sql_update_slot = "UPDATE pms_parkingslot SET Status = 'available' WHERE SlotID = ?";
        $stmt_slot = $conn->prepare($sql_update_slot);
        $stmt_slot->bind_param("i", $slotID);
        $stmt_slot->execute();
        
        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Vehicle exited successfully.']);
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function handleGetVehicleTypes($conn) {
    $sql = "SELECT VehicleTypeID, TypeName FROM pms_vehicletype ORDER BY TypeName";
    $result = $conn->query($sql);
    $data = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
    echo json_encode(['success' => true, 'types' => $data]);
}

function handleGetVehicleCategories($conn) {
    $typeID = $_GET['vehicleTypeID'] ?? 0;
    if ($typeID == 0) {
        echo json_encode(['success' => true, 'categories' => []]);
        exit;
    }
    $sql = "SELECT VehicleCategoryID, CategoryName FROM pms_vehiclecategory WHERE VehicleTypeID = ? ORDER BY CategoryName";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $typeID);
    $stmt->execute();
    $result = $stmt->get_result();
    $data = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
    echo json_encode(['success' => true, 'categories' => $data]);
}

function handleGetAvailableSlots($conn) {
    $typeID = $_GET['vehicleTypeID'] ?? 0;
    if ($typeID == 0) {
        echo json_encode(['success' => true, 'slots' => []]);
        exit;
    }
    
    $sql = "SELECT s.SlotID, s.SlotName, a.AreaName 
            FROM pms_parkingslot s
            JOIN pms_parkingarea a ON s.AreaID = a.AreaID
            WHERE s.Status = 'available' AND s.AllowedVehicleTypeID = ?
            ORDER BY a.AreaName, s.SlotName";
            
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $typeID);
    $stmt->execute();
    $result = $stmt->get_result();
    $data = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
    echo json_encode(['success' => true, 'slots' => $data]);
}

function handleGetParkingAreas($conn) {
    $sql = "SELECT AreaID, AreaName FROM pms_parkingarea ORDER BY AreaName";
    $result = $conn->query($sql);
    $data = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
    echo json_encode(['success' => true, 'areas' => $data]);
}

function handleGetDashboardData($conn) {
    $sql_cards = "SELECT 
        SUM(CASE WHEN Status = 'occupied' THEN 1 ELSE 0 END) AS occupied,
        SUM(CASE WHEN Status = 'available' THEN 1 ELSE 0 END) AS available,
        COUNT(SlotID) AS total
        FROM pms_parkingslot";
    $cards_result = $conn->query($sql_cards)->fetch_assoc();
    
    $sql_table = "SELECT a.AreaName,
        SUM(CASE WHEN s.Status = 'available' THEN 1 ELSE 0 END) AS available,
        SUM(CASE WHEN s.Status = 'occupied' THEN 1 ELSE 0 END) AS occupied,
        COUNT(s.SlotID) AS total,
        CASE WHEN COUNT(s.SlotID) = SUM(CASE WHEN s.Status = 'occupied' THEN 1 ELSE 0 END) THEN 'Full' ELSE 'Available' END AS status
        FROM pms_parkingslot s
        JOIN pms_parkingarea a ON s.AreaID = a.AreaID
        GROUP BY a.AreaID, a.AreaName ORDER BY a.AreaName";
    $table_result = $conn->query($sql_table);
    $table_data = $table_result ? $table_result->fetch_all(MYSQLI_ASSOC) : [];
    
    echo json_encode(['success' => true, 'cards' => $cards_result, 'table' => $table_data]);
}

function handleGetAllSlots($conn) {
    $sql = "SELECT s.SlotID, a.AreaName, s.SlotName, t.TypeName AS AllowedVehicle, s.Status
            FROM pms_parkingslot s
            JOIN pms_parkingarea a ON s.AreaID = a.AreaID
            JOIN pms_vehicletype t ON s.AllowedVehicleTypeID = t.VehicleTypeID
            ORDER BY a.AreaName, s.SlotName";
    $result = $conn->query($sql);
    $data = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
    echo json_encode(['success' => true, 'slots' => $data]);
}

/* *** MODIFIED: Added JOIN for AreaName *** */
function handleGetVehiclesIn($conn) {
    $sql = "SELECT 
        ps.SessionID, s.SlotName, ps.PlateNumber, ps.RoomNumber, ps.GuestName,
        t.TypeName AS VehicleType, c.CategoryName AS VehicleCategory,
        DATE_FORMAT(ps.EntryTime, '%h:%i %p') AS EnterTime,
        DATE_FORMAT(ps.EntryTime, '%Y-%m-%d') AS EnterDate,
        ps.EntryTime, s.SlotID,
        a.AreaName 
        FROM pms_parking_sessions ps
        JOIN pms_parkingslot s ON ps.SlotID = s.SlotID
        JOIN pms_vehicletype t ON ps.VehicleTypeID = t.VehicleTypeID
        JOIN pms_vehiclecategory c ON ps.VehicleCategoryID = c.VehicleCategoryID
        JOIN pms_parkingarea a ON s.AreaID = a.AreaID 
        WHERE ps.ExitTime IS NULL
        ORDER BY ps.EntryTime DESC";
    $result = $conn->query($sql);
    $data = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
    echo json_encode(['success' => true, 'vehicles' => $data]);
}

/* *** MODIFIED: Added JOIN for AreaName *** */
function handleGetHistory($conn) {
    $sql = "SELECT 
        s.SlotName, ps.PlateNumber, ps.RoomNumber, ps.GuestName,
        t.TypeName AS VehicleType, c.CategoryName AS VehicleCategory,
        CONCAT(
            TIMESTAMPDIFF(HOUR, ps.EntryTime, ps.ExitTime), 'h ',
            MOD(TIMESTAMPDIFF(MINUTE, ps.EntryTime, ps.ExitTime), 60), 'm'
        ) AS ParkingTime,
        DATE_FORMAT(ps.EntryTime, '%Y-%m-%d / %h:%i %p') AS EntryDateTime,
        DATE_FORMAT(ps.ExitTime, '%Y-%m-%d / %h:%i %p') AS ExitDateTime,
        ps.EntryTime, ps.ExitTime, 
        a.AreaName
        FROM pms_parking_sessions ps
        JOIN pms_parkingslot s ON ps.SlotID = s.SlotID
        JOIN pms_vehicletype t ON ps.VehicleTypeID = t.VehicleTypeID
        JOIN pms_vehiclecategory c ON ps.VehicleCategoryID = c.VehicleCategoryID
        JOIN pms_parkingarea a ON s.AreaID = a.AreaID
        WHERE ps.ExitTime IS NOT NULL
        ORDER BY ps.ExitTime DESC";
    $result = $conn->query($sql);
    $data = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
    echo json_encode(['success' => true, 'history' => $data]);
}

function handleUpdateUser($conn, $staffID) {
    $fname = $_POST['Fname'] ?? null;
    $lname = $_POST['Lname'] ?? null;
    $mname = $_POST['Mname'] ?? null;
    $birthday = $_POST['Birthday'] ?? null;
    $username = $_POST['Username'] ?? null;
    $email = $_POST['EmailAddress'] ?? null;
    $address = $_POST['Address'] ?? null;
    $contact = $_POST['ContactNumber'] ?? null;
    $password = $_POST['Password'] ?? null; 

    if (!$fname || !$lname || !$birthday || !$username || !$email || !$address || !$contact) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing required fields.']);
        exit;
    }

    try {
        if (!empty($password) && $password !== '************') {
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $sql = "UPDATE pms_users SET Fname=?, Lname=?, Mname=?, Birthday=?, Username=?, EmailAddress=?, Address=?, ContactNumber=?, Password=? WHERE UserID = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("sssssssssi", $fname, $lname, $mname, $birthday, $username, $email, $address, $contact, $hashedPassword, $staffID);
        } else {
            $sql = "UPDATE pms_users SET Fname=?, Lname=?, Mname=?, Birthday=?, Username=?, EmailAddress=?, Address=?, ContactNumber=? WHERE UserID = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ssssssssi", $fname, $lname, $mname, $birthday, $username, $email, $address, $contact, $staffID);
        }
        
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Account updated successfully.']);
        } else {
            echo json_encode(['success' => true, 'message' => 'No changes detected.']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        if ($conn->errno == 1062) {
             echo json_encode(['success' => false, 'error' => 'Username or Email already exists.']);
        } else {
             echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
}

function handleGetGuests($conn) {
    
    // Selects the room number and status from your 'rooms' table
   $sql = "SELECT room_num FROM tbl_rooms";
 
    $result = $conn->query($sql);
    
    if (!$result) {
        // If the query fails
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to query rooms. Check API SQL: ' . $conn->error]);
        exit;
    }

    $data = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
    
    // Note: The key is now 'rooms', not 'guests'.
    echo json_encode(['success' => true, 'rooms' => $data]);
}
// --- END OF FUNCTION ---
?>
