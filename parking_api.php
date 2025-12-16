<?php
// pms-hotel-management/parking_api.php

require_once('db_connection.php'); 
require_once('user.php'); 

if (session_status() == PHP_SESSION_NONE) {
    session_start([
        'cookie_httponly' => true,
        'cookie_secure' => isset($_SERVER['HTTPS']),
        'use_strict_mode' => true
    ]);
}

$conn = get_db_connection('b9wkqgu32onfqy0dvyva');
if (!$conn) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed.']);
    exit;
}

$action = $_POST['action'] ?? $_GET['action'] ?? '';
header('Content-Type: application/json');

$staffID = $_SESSION['UserID'] ?? null;
if (!$staffID) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'User not logged in.']);
    $conn->close();
    exit;
}

try {
    switch ($action) {
        // --- VEHICLE OPERATIONS ---
        case 'enterVehicle': handleEnterVehicle($conn, $staffID); break;
        case 'exitVehicle': handleExitVehicle($conn, $staffID); break;
        
        // --- DATA FETCHING ---
        case 'getVehicleTypes': handleGetVehicleTypes($conn); break;
        case 'getVehicleCategories': handleGetVehicleCategories($conn); break;
        case 'getDashboardData': handleGetDashboardData($conn); break;
        case 'getAllSlots': handleGetAllSlots($conn); break; 
        case 'getVehiclesIn': handleGetVehiclesIn($conn); break;
        case 'getHistory': handleGetHistory($conn); break;
        case 'getParkingAreas': handleGetParkingAreas($conn); break;
        case 'getGuests': handleGetGuests($conn); break;

        // --- MANAGE AREAS ---
        case 'getManageAreas': handleGetManageAreas($conn); break;
        case 'addArea': handleAddArea($conn); break;
        case 'updateArea': handleUpdateArea($conn); break;
        case 'archiveArea': handleArchiveArea($conn); break;
        case 'restoreArea': handleRestoreArea($conn); break;

        // --- MANAGE SLOTS ---
        case 'addSlot': handleAddSlot($conn); break;
        case 'updateSlot': handleUpdateSlot($conn); break;
        case 'archiveSlot': handleArchiveSlot($conn); break;
        case 'restoreSlot': handleRestoreSlot($conn); break;

        // --- MANAGE TYPES/CATEGORIES ---
        case 'addVehicleType': handleAddVehicleType($conn); break;
        case 'updateVehicleType': handleUpdateVehicleType($conn); break;
        case 'archiveVehicleType': handleArchiveVehicleType($conn); break; 
        case 'restoreVehicleType': handleRestoreVehicleType($conn); break; 
        
        case 'addVehicleCategory': handleAddVehicleCategory($conn); break;
        case 'updateVehicleCategory': handleUpdateVehicleCategory($conn); break;
        case 'archiveVehicleCategory': handleArchiveVehicleCategory($conn); break; 
        case 'restoreVehicleCategory': handleRestoreVehicleCategory($conn); break; 

        default:
            throw new Exception("Invalid action: $action");
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

$conn->close();
exit;

// ==========================================
// AREA MANAGEMENT
// ==========================================

function handleGetManageAreas($conn) {
    $data = $conn->query("SELECT * FROM pms_parkingarea ORDER BY is_archived ASC, AreaName ASC")->fetch_all(MYSQLI_ASSOC);
    echo json_encode(['success' => true, 'areas' => $data]);
}

function handleAddArea($conn) {
    $name = trim($_POST['AreaName'] ?? '');
    if (!$name) throw new Exception("Area name required.");

    // CHECK DUPLICATE AREA NAME
    $check = $conn->prepare("SELECT AreaID FROM pms_parkingarea WHERE AreaName = ?");
    $check->bind_param("s", $name);
    $check->execute();
    $check->store_result();
    if ($check->num_rows > 0) {
        throw new Exception("Area name '$name' already exists.");
    }
    $check->close();

    $stmt = $conn->prepare("INSERT INTO pms_parkingarea (AreaName, is_archived) VALUES (?, 0)");
    $stmt->bind_param("s", $name);
    if ($stmt->execute()) echo json_encode(['success' => true, 'message' => 'Area added.']);
    else throw new Exception($stmt->error);
}

function handleUpdateArea($conn) {
    $id = $_POST['AreaID'] ?? 0;
    $name = trim($_POST['AreaName'] ?? '');
    if (!$id || !$name) throw new Exception("ID and Name required.");

    // CHECK DUPLICATE AREA NAME (Excluding current ID)
    $check = $conn->prepare("SELECT AreaID FROM pms_parkingarea WHERE AreaName = ? AND AreaID != ?");
    $check->bind_param("si", $name, $id);
    $check->execute();
    $check->store_result();
    if ($check->num_rows > 0) {
        throw new Exception("Area name '$name' already exists.");
    }
    $check->close();

    $stmt = $conn->prepare("UPDATE pms_parkingarea SET AreaName = ? WHERE AreaID = ?");
    $stmt->bind_param("si", $name, $id);
    if ($stmt->execute()) echo json_encode(['success' => true, 'message' => 'Area updated.']);
    else throw new Exception($stmt->error);
}

function handleArchiveArea($conn) {
    $id = $_POST['AreaID'] ?? 0;
    if (!$id) throw new Exception("Area ID required.");
    $check = $conn->prepare("SELECT 1 FROM pms_parkingslot WHERE AreaID = ? AND is_archived = 0 AND Status = 'occupied'");
    $check->bind_param("i", $id);
    $check->execute();
    if ($check->get_result()->num_rows > 0) throw new Exception("Cannot archive area. Some slots are currently occupied.");
    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("UPDATE pms_parkingarea SET is_archived = 1 WHERE AreaID = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $stmt2 = $conn->prepare("UPDATE pms_parkingslot SET is_archived = 1 WHERE AreaID = ?");
        $stmt2->bind_param("i", $id);
        $stmt2->execute();
        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Area archived.']);
    } catch (Exception $e) { $conn->rollback(); throw $e; }
}

function handleRestoreArea($conn) {
    $id = $_POST['AreaID'] ?? 0;
    if (!$id) throw new Exception("Area ID required.");
    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("UPDATE pms_parkingarea SET is_archived = 0 WHERE AreaID = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $stmt2 = $conn->prepare("UPDATE pms_parkingslot SET is_archived = 0 WHERE AreaID = ?");
        $stmt2->bind_param("i", $id);
        $stmt2->execute();
        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Area restored.']);
    } catch (Exception $e) { $conn->rollback(); throw $e; }
}

// ==========================================
// SLOT MANAGEMENT
// ==========================================

function handleAddSlot($conn) {
    $areaID = $_POST['AreaID'] ?? 0; 
    $name = trim($_POST['SlotName'] ?? ''); 
    $typeID = $_POST['AllowedVehicleTypeID'] ?? 0;
    
    if (!$areaID || !$name || !$typeID) throw new Exception("All fields required.");

    // CHECK DUPLICATE SLOT NAME IN THIS AREA
    $check = $conn->prepare("SELECT SlotID FROM pms_parkingslot WHERE AreaID = ? AND SlotName = ?");
    $check->bind_param("is", $areaID, $name);
    $check->execute();
    $check->store_result();
    if ($check->num_rows > 0) {
        throw new Exception("Slot '$name' already exists in this area.");
    }
    $check->close();

    $stmt = $conn->prepare("INSERT INTO pms_parkingslot (AreaID, SlotName, AllowedVehicleTypeID, Status, is_archived) VALUES (?, ?, ?, 'available', 0)");
    $stmt->bind_param("isi", $areaID, $name, $typeID);
    if ($stmt->execute()) echo json_encode(['success' => true, 'message' => 'Slot added.']);
    else throw new Exception($stmt->error);
}

function handleUpdateSlot($conn) {
    $id = $_POST['SlotID'] ?? 0; 
    $name = trim($_POST['SlotName'] ?? ''); 
    $typeID = $_POST['AllowedVehicleTypeID'] ?? 0;
    
    if (!$id || !$name || !$typeID) throw new Exception("All fields required.");

    // --- CHECK OCCUPANCY AND GET CURRENT AREA ---
    $check = $conn->prepare("SELECT Status, AreaID FROM pms_parkingslot WHERE SlotID = ?");
    $check->bind_param("i", $id);
    $check->execute();
    $result = $check->get_result()->fetch_assoc();
    $status = $result['Status'] ?? '';
    $currentAreaID = $result['AreaID'] ?? 0;
    $check->close();

    if ($status === 'occupied') throw new Exception("Cannot edit an occupied slot.");

    // CHECK DUPLICATE SLOT NAME IN THIS AREA (Excluding current Slot)
    $checkDup = $conn->prepare("SELECT SlotID FROM pms_parkingslot WHERE AreaID = ? AND SlotName = ? AND SlotID != ?");
    $checkDup->bind_param("isi", $currentAreaID, $name, $id);
    $checkDup->execute();
    $checkDup->store_result();
    if ($checkDup->num_rows > 0) {
        throw new Exception("Slot '$name' already exists in this area.");
    }
    $checkDup->close();

    $stmt = $conn->prepare("UPDATE pms_parkingslot SET SlotName = ?, AllowedVehicleTypeID = ? WHERE SlotID = ?");
    $stmt->bind_param("sii", $name, $typeID, $id);
    if ($stmt->execute()) echo json_encode(['success' => true, 'message' => 'Slot updated.']);
    else throw new Exception($stmt->error);
}

function handleArchiveSlot($conn) {
    $id = $_POST['SlotID'] ?? 0;
    if (!$id) throw new Exception("Slot ID required.");
    
    // --- CHECK OCCUPANCY BEFORE ARCHIVE ---
    $check = $conn->prepare("SELECT Status FROM pms_parkingslot WHERE SlotID = ?");
    $check->bind_param("i", $id); $check->execute();
    $status = $check->get_result()->fetch_assoc()['Status'] ?? '';
    if ($status === 'occupied') throw new Exception("Cannot archive an occupied slot.");
    // --------------------------------------

    $stmt = $conn->prepare("UPDATE pms_parkingslot SET is_archived = 1 WHERE SlotID = ?");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) echo json_encode(['success' => true, 'message' => 'Slot archived.']);
    else throw new Exception($stmt->error);
}

function handleRestoreSlot($conn) {
    $id = $_POST['SlotID'] ?? 0;
    $stmt = $conn->prepare("UPDATE pms_parkingslot SET is_archived = 0 WHERE SlotID = ?");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) echo json_encode(['success' => true, 'message' => 'Slot restored.']);
    else throw new Exception($stmt->error);
}

// ==========================================
// FETCHING FUNCTIONS
// ==========================================

function handleGetParkingAreas($conn) {
    $sql = "SELECT AreaID, AreaName FROM pms_parkingarea WHERE is_archived = 0 ORDER BY AreaName";
    $result = $conn->query($sql);
    $data = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
    echo json_encode(['success' => true, 'areas' => $data]);
}

function handleGetAllSlots($conn) {
    $slotsSql = "SELECT s.SlotID, s.AreaID, a.AreaName, s.SlotName, s.AllowedVehicleTypeID, t.TypeName AS AllowedVehicle, s.Status, s.is_archived
            FROM pms_parkingslot s
            JOIN pms_parkingarea a ON s.AreaID = a.AreaID
            LEFT JOIN pms_vehicletype t ON s.AllowedVehicleTypeID = t.VehicleTypeID
            WHERE a.is_archived = 0 
            ORDER BY s.is_archived ASC, s.Status ASC, a.AreaName, s.SlotName";
            
    $slots = $conn->query($slotsSql)->fetch_all(MYSQLI_ASSOC);

    echo json_encode(['success' => true, 'slots' => $slots]);
}

function handleGetDashboardData($conn) {
    $sql_cards = "SELECT 
        SUM(CASE WHEN Status = 'occupied' AND is_archived = 0 THEN 1 ELSE 0 END) AS occupied,
        SUM(CASE WHEN Status = 'available' AND is_archived = 0 THEN 1 ELSE 0 END) AS available,
        COUNT(CASE WHEN is_archived = 0 THEN 1 END) AS total
        FROM pms_parkingslot";
    $cards = $conn->query($sql_cards)->fetch_assoc();
    $sql_table = "SELECT a.AreaName,
        SUM(CASE WHEN s.Status = 'available' AND s.is_archived = 0 THEN 1 ELSE 0 END) AS available,
        SUM(CASE WHEN s.Status = 'occupied' AND s.is_archived = 0 THEN 1 ELSE 0 END) AS occupied,
        COUNT(CASE WHEN s.is_archived = 0 THEN 1 END) AS total,
        CASE WHEN COUNT(CASE WHEN s.is_archived = 0 THEN 1 END) > 0 AND COUNT(CASE WHEN s.is_archived = 0 THEN 1 END) = SUM(CASE WHEN s.Status = 'occupied' AND s.is_archived = 0 THEN 1 ELSE 0 END) THEN 'Full' ELSE 'Available' END AS status,
        a.AreaID
        FROM pms_parkingarea a
        LEFT JOIN pms_parkingslot s ON a.AreaID = s.AreaID
        WHERE a.is_archived = 0
        GROUP BY a.AreaID, a.AreaName ORDER BY a.AreaName";
    $table = $conn->query($sql_table)->fetch_all(MYSQLI_ASSOC);
    echo json_encode(['success' => true, 'cards' => $cards, 'table' => $table]);
}

// ==========================================
// VEHICLE TYPE & CATEGORY MANAGEMENT
// ==========================================

function handleAddVehicleType($conn) { 
    $conn->query("INSERT INTO pms_vehicletype (TypeName, is_archived) VALUES ('".trim($_POST['TypeName'])."', 0)");
    echo json_encode(['success' => true, 'message' => 'Type Added']);
}
function handleAddVehicleCategory($conn) {
    $conn->query("INSERT INTO pms_vehiclecategory (VehicleTypeID, CategoryName, is_archived) VALUES (".$_POST['VehicleTypeID'].", '".trim($_POST['CategoryName'])."', 0)");
    echo json_encode(['success' => true, 'message' => 'Category Added']);
}
function handleUpdateVehicleType($conn) {
    $conn->query("UPDATE pms_vehicletype SET TypeName='".trim($_POST['TypeName'])."' WHERE VehicleTypeID=".$_POST['TypeID']);
    echo json_encode(['success' => true, 'message' => 'Updated']);
}
function handleUpdateVehicleCategory($conn) {
    $conn->query("UPDATE pms_vehiclecategory SET CategoryName='".trim($_POST['CategoryName'])."' WHERE VehicleCategoryID=".$_POST['CategoryID']);
    echo json_encode(['success' => true, 'message' => 'Updated']);
}
function handleArchiveVehicleType($conn) {
    $conn->query("UPDATE pms_vehicletype SET is_archived=1 WHERE VehicleTypeID=".$_POST['TypeID']);
    $conn->query("UPDATE pms_vehiclecategory SET is_archived=1 WHERE VehicleTypeID=".$_POST['TypeID']);
    echo json_encode(['success' => true, 'message' => 'Type Archived']);
}
function handleRestoreVehicleType($conn) {
    $conn->query("UPDATE pms_vehicletype SET is_archived=0 WHERE VehicleTypeID=".$_POST['TypeID']);
    $conn->query("UPDATE pms_vehiclecategory SET is_archived=0 WHERE VehicleTypeID=".$_POST['TypeID']);
    echo json_encode(['success' => true, 'message' => 'Type Restored']);
}
function handleArchiveVehicleCategory($conn) {
    $conn->query("UPDATE pms_vehiclecategory SET is_archived=1 WHERE VehicleCategoryID=".$_POST['CategoryID']);
    echo json_encode(['success' => true, 'message' => 'Category Archived']);
}
function handleRestoreVehicleCategory($conn) {
    $conn->query("UPDATE pms_vehiclecategory SET is_archived=0 WHERE VehicleCategoryID=".$_POST['CategoryID']);
    echo json_encode(['success' => true, 'message' => 'Category Restored']);
}

// --- GETTERS ---
function handleGetVehicleTypes($conn) {
    $data = $conn->query("SELECT * FROM pms_vehicletype ORDER BY is_archived ASC, TypeName ASC")->fetch_all(MYSQLI_ASSOC);
    echo json_encode(['success' => true, 'types' => $data]);
}
function handleGetVehicleCategories($conn) {
    $id = $_GET['vehicleTypeID'] ?? 0;
    $data = $conn->query("SELECT * FROM pms_vehiclecategory WHERE VehicleTypeID=$id ORDER BY is_archived ASC, CategoryName ASC")->fetch_all(MYSQLI_ASSOC);
    echo json_encode(['success' => true, 'categories' => $data]);
}

function handleGetVehiclesIn($conn) {
    $sql = "SELECT ps.SessionID, s.SlotName, ps.PlateNumber, ps.RoomNumber, ps.GuestName, 
            t.TypeName AS VehicleType, c.CategoryName AS VehicleCategory, 
            DATE_FORMAT(ps.EntryTime, '%h:%i %p') AS EnterTime, 
            DATE_FORMAT(ps.EntryTime, '%Y-%m-%d') AS EnterDate, 
            ps.EntryTime, s.SlotID, a.AreaName 
            FROM pms_parking_sessions ps 
            JOIN pms_parkingslot s ON ps.SlotID = s.SlotID 
            LEFT JOIN pms_vehicletype t ON ps.VehicleTypeID = t.VehicleTypeID 
            LEFT JOIN pms_vehiclecategory c ON ps.VehicleCategoryID = c.VehicleCategoryID 
            JOIN pms_parkingarea a ON s.AreaID = a.AreaID 
            WHERE ps.ExitTime IS NULL 
            ORDER BY ps.EntryTime DESC";
    echo json_encode(['success' => true, 'vehicles' => $conn->query($sql)->fetch_all(MYSQLI_ASSOC)]);
}
function handleGetHistory($conn) {
    $sql = "SELECT s.SlotName, ps.PlateNumber, ps.RoomNumber, ps.GuestName, 
            t.TypeName AS VehicleType, c.CategoryName AS VehicleCategory, 
            CONCAT(TIMESTAMPDIFF(HOUR, ps.EntryTime, ps.ExitTime), 'h ', MOD(TIMESTAMPDIFF(MINUTE, ps.EntryTime, ps.ExitTime), 60), 'm') AS ParkingTime, 
            DATE_FORMAT(ps.EntryTime, '%Y-%m-%d / %h:%i %p') AS EntryDateTime, 
            DATE_FORMAT(ps.ExitTime, '%Y-%m-%d / %h:%i %p') AS ExitDateTime, 
            ps.EntryTime, ps.ExitTime, a.AreaName 
            FROM pms_parking_sessions ps 
            JOIN pms_parkingslot s ON ps.SlotID = s.SlotID 
            LEFT JOIN pms_vehicletype t ON ps.VehicleTypeID = t.VehicleTypeID 
            LEFT JOIN pms_vehiclecategory c ON ps.VehicleCategoryID = c.VehicleCategoryID 
            JOIN pms_parkingarea a ON s.AreaID = a.AreaID 
            WHERE ps.ExitTime IS NOT NULL 
            ORDER BY ps.ExitTime DESC";
    echo json_encode(['success' => true, 'history' => $conn->query($sql)->fetch_all(MYSQLI_ASSOC)]);
}
function handleGetGuests($conn) {
   $sql = "SELECT room_num FROM tbl_rooms";
   echo json_encode(['success' => true, 'rooms' => $conn->query($sql)->fetch_all(MYSQLI_ASSOC)]);
}
function handleEnterVehicle($conn, $staffID) {
    $slotID = $_POST['slotID']; $plate = $_POST['plateNumber']; $guest = $_POST['guestName']; $room = $_POST['roomNumber']; $type = $_POST['vehicleTypeID']; $cat = $_POST['vehicleCategoryID'];
    $conn->query("INSERT INTO pms_parking_sessions (SlotID, PlateNumber, GuestName, RoomNumber, VehicleTypeID, VehicleCategoryID, EntryTime, StaffID_Entry) VALUES ($slotID, '$plate', '$guest', '$room', $type, $cat, NOW(), $staffID)");
    $conn->query("UPDATE pms_parkingslot SET Status = 'occupied' WHERE SlotID = $slotID");
    echo json_encode(['success' => true, 'message' => 'Vehicle entered']);
}
function handleExitVehicle($conn, $staffID) {
    $sid = $_POST['sessionID']; $slot = $_POST['slotID'];
    $conn->query("UPDATE pms_parking_sessions SET ExitTime = NOW() WHERE SessionID = $sid");
    $conn->query("UPDATE pms_parkingslot SET Status = 'available' WHERE SlotID = $slot");
    echo json_encode(['success' => true, 'message' => 'Vehicle exited']);
}
?>