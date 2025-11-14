<?php
// pms-hotel-management/parking_api.php

// 1. Include necessary files
require_once('db_connection.php'); // For the $conn database connection
// require_once('User.php'); // Commented out as UserID comes from session

// 2. Start the session
if (session_status() == PHP_SESSION_NONE) {
    session_start([
        'cookie_httponly' => true,
        'cookie_secure' => isset($_SERVER['HTTPS']),
        'use_strict_mode' => true
    ]);
}

// 3. Get the database connection
// $conn = get_db_connection('pms'); // Assuming db_connection.php already creates $conn
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
    // case 'updateUser': // This action seems to be missing, but was in the JS. Adding it is a separate task.
    //     handleUpdateUser($conn, $staffID);
    //     break;

    // === NEW ACTIONS FOR TYPES & CATEGORIES ===
    case 'addVehicleType':
        handleAddVehicleType($conn);
        break;
    case 'updateVehicleType':
        handleUpdateVehicleType($conn);
        break;
    case 'deleteVehicleType':
        handleDeleteVehicleType($conn);
        break;
    case 'addVehicleCategory':
        handleAddVehicleCategory($conn);
        break;
    case 'updateVehicleCategory':
        handleUpdateVehicleCategory($conn);
        break;
    case 'deleteVehicleCategory':
        handleDeleteVehicleCategory($conn);
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
    $slotID = (int)($_POST['slotID'] ?? 0);
    
    // === SANITIZED INPUTS ===
    $plateNumber = htmlspecialchars(trim($_POST['plateNumber'] ?? ''), ENT_QUOTES, 'UTF-8');
    $guestName = htmlspecialchars(trim($_POST['guestName'] ?? ''), ENT_QUOTES, 'UTF-8');
    $roomNumber = htmlspecialchars(trim($_POST['roomNumber'] ?? ''), ENT_QUOTES, 'UTF-8');
    
    $vehicleTypeID = (int)($_POST['vehicleTypeID'] ?? 0);
    $vehicleCategoryID = (int)($_POST['vehicleCategoryID'] ?? 0);
    
    if (empty($plateNumber)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Plate number is required.']);
        exit;
    }
    if ($slotID <= 0 || $vehicleTypeID <= 0 || $vehicleCategoryID <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing required fields (Slot, Type, or Category).']);
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
    $sessionID = (int)($_POST['sessionID'] ?? 0);
    $slotID = (int)($_POST['slotID'] ?? 0);
    if ($sessionID <= 0 || $slotID <= 0) {
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
    $typeID = (int)($_GET['vehicleTypeID'] ?? 0);
    
    // This is a special case. If no typeID is provided, return nothing.
    // The main `getVehicleTypes` is used to get the list of types.
    if ($typeID <= 0) {
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
    $typeID = (int)($_GET['vehicleTypeID'] ?? 0);
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

// === NEW FUNCTIONS FOR MANAGING TYPES & CATEGORIES ===

function handleAddVehicleType($conn) {
    $name = htmlspecialchars(trim($_POST['TypeName'] ?? ''), ENT_QUOTES, 'UTF-8');
    if (empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Type name cannot be empty.']);
        exit;
    }
    // Check for duplicates
    $checkStmt = $conn->prepare("SELECT 1 FROM pms_vehicletype WHERE TypeName = ?");
    $checkStmt->bind_param("s", $name);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'This vehicle type already exists.']);
        exit;
    }
    // Insert
    $stmt = $conn->prepare("INSERT INTO pms_vehicletype (TypeName) VALUES (?)");
    $stmt->bind_param("s", $name);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Vehicle Type added.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
    }
}

function handleUpdateVehicleType($conn) {
    $id = (int)($_POST['TypeID'] ?? 0);
    $name = htmlspecialchars(trim($_POST['TypeName'] ?? ''), ENT_QUOTES, 'UTF-8');
    if ($id <= 0 || empty($name)) {
        echo json_encode(['success' => false, 'message' => 'ID and Name are required.']);
        exit;
    }
    // Check for duplicates
    $checkStmt = $conn->prepare("SELECT 1 FROM pms_vehicletype WHERE TypeName = ? AND VehicleTypeID != ?");
    $checkStmt->bind_param("si", $name, $id);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'This vehicle type name is already in use.']);
        exit;
    }
    // Update
    $stmt = $conn->prepare("UPDATE pms_vehicletype SET TypeName = ? WHERE VehicleTypeID = ?");
    $stmt->bind_param("si", $name, $id);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Vehicle Type updated.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
    }
}

function handleDeleteVehicleType($conn) {
    $id = (int)($_POST['TypeID'] ?? 0);
    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid ID.']);
        exit;
    }
    
    // Safety Check 1: Check categories
    $check1 = $conn->prepare("SELECT 1 FROM pms_vehiclecategory WHERE VehicleTypeID = ? LIMIT 1");
    $check1->bind_param("i", $id);
    $check1->execute();
    if ($check1->get_result()->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Cannot delete: This type is used by vehicle categories.']);
        exit;
    }
    
    // Safety Check 2: Check parking slots
    $check2 = $conn->prepare("SELECT 1 FROM pms_parkingslot WHERE AllowedVehicleTypeID = ? LIMIT 1");
    $check2->bind_param("i", $id);
    $check2->execute();
    if ($check2->get_result()->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Cannot delete: This type is assigned to parking slots.']);
        exit;
    }

    // Delete
    $stmt = $conn->prepare("DELETE FROM pms_vehicletype WHERE VehicleTypeID = ?");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Vehicle Type deleted.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
    }
}

function handleAddVehicleCategory($conn) {
    $typeID = (int)($_POST['VehicleTypeID'] ?? 0);
    $name = htmlspecialchars(trim($_POST['CategoryName'] ?? ''), ENT_QUOTES, 'UTF-8');
    if ($typeID <= 0 || empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Type ID and Category Name are required.']);
        exit;
    }
    // Check for duplicates *within this type*
    $checkStmt = $conn->prepare("SELECT 1 FROM pms_vehiclecategory WHERE CategoryName = ? AND VehicleTypeID = ?");
    $checkStmt->bind_param("si", $name, $typeID);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'This category already exists for this type.']);
        exit;
    }
    // Insert
    $stmt = $conn->prepare("INSERT INTO pms_vehiclecategory (VehicleTypeID, CategoryName) VALUES (?, ?)");
    $stmt->bind_param("is", $typeID, $name);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Vehicle Category added.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
    }
}

function handleUpdateVehicleCategory($conn) {
    $id = (int)($_POST['CategoryID'] ?? 0);
    $name = htmlspecialchars(trim($_POST['CategoryName'] ?? ''), ENT_QUOTES, 'UTF-8');
    if ($id <= 0 || empty($name)) {
        echo json_encode(['success' => false, 'message' => 'ID and Name are required.']);
        exit;
    }
    // Check for duplicates
    $checkStmt = $conn->prepare("SELECT 1 FROM pms_vehiclecategory WHERE CategoryName = ? AND VehicleCategoryID != ?");
    $checkStmt->bind_param("si", $name, $id);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'This category name is already in use.']);
        exit;
    }
    // Update
    $stmt = $conn->prepare("UPDATE pms_vehiclecategory SET CategoryName = ? WHERE VehicleCategoryID = ?");
    $stmt->bind_param("si", $name, $id);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Vehicle Category updated.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
    }
}

function handleDeleteVehicleCategory($conn) {
    $id = (int)($_POST['CategoryID'] ?? 0);
    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid ID.']);
        exit;
    }
    
    // Safety Check: Check parking sessions
    $check = $conn->prepare("SELECT 1 FROM pms_parking_sessions WHERE VehicleCategoryID = ? LIMIT 1");
    $check->bind_param("i", $id);
    $check->execute();
    if ($check->get_result()->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Cannot delete: This category is used in parking history.']);
        exit;
    }

    // Delete
    $stmt = $conn->prepare("DELETE FROM pms_vehiclecategory WHERE VehicleCategoryID = ?");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Vehicle Category deleted.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
    }
}

?>