<?php
/**
 * Room Items API
 * Handles all operations related to room items and reusable items
 */

header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');

session_start();
require_once('db_connection.php');

// Authorization check
$allowedRoles = ['admin', 'housekeeping_manager', 'housekeeping_staff', 'maintenance_manager', 'maintenance_staff', 'inventory_manager'];

if (!isset($_SESSION['UserID']) || !in_array($_SESSION['UserType'], $allowedRoles)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit();
}

$conn = get_db_connection('bt3wljbwprykeblz7tvq');
if ($conn === null) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection error.']);
    exit();
}

$user_id = $_SESSION['UserID'];
$request_method = $_SERVER['REQUEST_METHOD'];
$response = ['success' => false, 'message' => 'Invalid action.'];

$data = [];
if ($request_method === 'POST' || $request_method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        $data = [];
    }
}

$action = trim($_GET['action'] ?? $_POST['action'] ?? $data['action'] ?? '');

// ====================================================================
// GET ROOM ITEMS
// ====================================================================
if ($request_method === 'GET' && $action === 'get_room_items') {
    $room_id = intval($_GET['room_id'] ?? 0);
    
    if ($room_id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid room_id.']);
        exit();
    }

    $sql = "SELECT 
                ri.room_item_id,
                ri.item_id,
                ri.quantity,
                ri.date_assigned,
                ri.last_maintained,
                ri.last_changed,
                i.ItemName,
                i.ItemType,
                ic.ItemCategoryName,
                u.Fname,
                u.Lname
            FROM pms_room_items ri
            JOIN pms_inventory i ON ri.item_id = i.ItemID
            JOIN pms_itemcategory ic ON i.ItemCategoryID = ic.ItemCategoryID
            LEFT JOIN pms_users u ON ri.assigned_by = u.UserID
            WHERE ri.room_id = ? AND ri.date_removed IS NULL
            ORDER BY ri.date_assigned DESC";

    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("i", $room_id);
        if ($stmt->execute()) {
            $result = $stmt->get_result();
            $items = [];
            while ($row = $result->fetch_assoc()) {
                $assignedBy = 'System';
                if ($row['Fname']) {
                    $assignedBy = trim($row['Fname'] . ' ' . $row['Lname']);
                }
                $items[] = [
                    'room_item_id' => $row['room_item_id'],
                    'item_id' => $row['item_id'],
                    'name' => $row['ItemName'],
                    'quantity' => $row['quantity'],
                    'type' => $row['ItemType'],
                    'category' => $row['ItemCategoryName'],
                    'date_assigned' => $row['date_assigned'],
                    'last_maintained' => $row['last_maintained'],
                    'last_changed' => $row['last_changed'],
                    'assigned_by' => $assignedBy
                ];
            }
            $response['success'] = true;
            $response['data'] = $items;
        } else {
            $response['message'] = "Database error: " . $stmt->error;
        }
        $stmt->close();
    } else {
        $response['message'] = "Prepare error: " . $conn->error;
    }
}

// ====================================================================
// ADD ITEM TO ROOM
// ====================================================================
elseif ($request_method === 'POST' && $action === 'add_room_item') {
    $room_id = intval($data['room_id'] ?? 0);
    $item_id = intval($data['item_id'] ?? 0);
    $quantity = intval($data['quantity'] ?? 1);

    if ($room_id <= 0 || $item_id <= 0 || $quantity <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid parameters.']);
        exit();
    }

    // Verify room exists
    $checkRoom = $conn->prepare("SELECT room_id FROM tbl_rooms WHERE room_id = ?");
    $checkRoom->bind_param("i", $room_id);
    $checkRoom->execute();
    if (!$checkRoom->get_result()->fetch_assoc()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Room not found.']);
        exit();
    }
    $checkRoom->close();

    // Verify item exists and get current status
    $checkItem = $conn->prepare("SELECT ItemID, ItemQuantity, StockLimit, RestockDate FROM pms_inventory WHERE ItemID = ?");
    $checkItem->bind_param("i", $item_id);
    $checkItem->execute();
    $itemData = $checkItem->get_result()->fetch_assoc();
    if (!$itemData) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Item not found.']);
        exit();
    }
    $checkItem->close();

    // Check if inventory has enough quantity
    if ($itemData['ItemQuantity'] < $quantity) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Insufficient inventory quantity.']);
        exit();
    }

    // Add item to room
    $sql = "INSERT INTO pms_room_items (room_id, item_id, quantity, assigned_by) 
            VALUES (?, ?, ?, ?)";
    
    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("iiii", $room_id, $item_id, $quantity, $user_id);
        if ($stmt->execute()) {
            $room_item_id = $stmt->insert_id;
            $stmt->close();

            // Calculate new inventory quantity and status
            $currentQuantity = (int)$itemData['ItemQuantity'];
            $stockLimit = (int)($itemData['StockLimit'] ?? 1);
            $currentRestockDate = $itemData['RestockDate'];
            $newQuantity = $currentQuantity - $quantity;

            $status = 'In Stock';
            $yellowThreshold = $stockLimit / 2;
            $orangeThreshold = $stockLimit / 4;
            $restockDate = NULL;

            if ($newQuantity <= 0 || $newQuantity <= $yellowThreshold) {
                if ($newQuantity <= 0) $status = 'Out of Stock';
                else if ($newQuantity <= $orangeThreshold) $status = 'Critical';
                else $status = 'Threshold';
                $restockDate = $currentRestockDate ? $currentRestockDate : date('Y-m-d', strtotime('+7 days'));
            }

            // Deduct from inventory & update status
            $updateSql = "UPDATE pms_inventory SET ItemQuantity = ?, ItemStatus = ?, RestockDate = ? WHERE ItemID = ?";
            $updateSuccess = false;
            if ($updateStmt = $conn->prepare($updateSql)) {
                $updateStmt->bind_param("issi", $newQuantity, $status, $restockDate, $item_id);
                if ($updateStmt->execute()) {
                    $updateSuccess = true;
                }
                $updateStmt->close();
            }

            // Log the action for the room history
            $logSql = "INSERT INTO pms_room_items_log (room_id, item_id, action, quantity, performed_by) 
                      VALUES (?, ?, 'assigned', ?, ?)";
            if ($logStmt = $conn->prepare($logSql)) {
                $logStmt->bind_param("iiii", $room_id, $item_id, $quantity, $user_id);
                $logStmt->execute();
                $logStmt->close();
            }

            if ($updateSuccess) {
                // LOG TO INVENTORY HISTORY
                $invLogSql = "INSERT INTO pms_inventorylog (UserID, ItemID, Quantity, InventoryLogReason, DateofRelease) VALUES (?, ?, ?, 'Item Issued (Room Assignment)', NOW())";
                if ($invLogStmt = $conn->prepare($invLogSql)) {
                    $negQuantity = -$quantity; // Log as negative deduction
                    $invLogStmt->bind_param("iii", $user_id, $item_id, $negQuantity);
                    $invLogStmt->execute();
                    $invLogStmt->close();
                }

                $response['success'] = true;
                $response['message'] = 'Item added to room successfully. Inventory reduced by ' . $quantity . ' unit(s).';
                $response['room_item_id'] = $room_item_id;
            } else {
                $response['success'] = false;
                $response['message'] = 'Item added to room but inventory deduction failed. Please contact administrator.';
                $response['room_item_id'] = $room_item_id;
            }
        } else {
            $response['message'] = "Error adding item to room: " . $stmt->error;
            $stmt->close();
        }
    } else {
        $response['message'] = "Prepare error: " . $conn->error;
    }
}

// ====================================================================
// REMOVE ITEM FROM ROOM (Item is consumed, partial deductions allowed)
// ====================================================================
elseif ($request_method === 'POST' && $action === 'remove_room_item') {
    $room_item_id = intval($data['room_item_id'] ?? 0);
    $remove_quantity = intval($data['quantity'] ?? 0);

    if ($room_item_id <= 0 || $remove_quantity <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid parameters.']);
        exit();
    }

    // Fetch the quantity and item_id before removing it (so we can log it)
    $getRi = $conn->prepare("SELECT item_id, quantity, room_id FROM pms_room_items WHERE room_item_id = ?");
    $getRi->bind_param("i", $room_item_id);
    $getRi->execute();
    $riData = $getRi->get_result()->fetch_assoc();
    $getRi->close();

    if (!$riData) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Room item record not found.']);
        exit();
    }

    $item_id = $riData['item_id'];
    $current_quantity = intval($riData['quantity']);
    $room_id = $riData['room_id'];

    // Safely enforce maximum removal limit
    if ($remove_quantity > $current_quantity) {
        $remove_quantity = $current_quantity;
    }

    $success = false;

    // If removing everything, mark as removed entirely. Otherwise, subtract the quantity.
    if ($remove_quantity == $current_quantity) {
        $sql = "UPDATE pms_room_items SET date_removed = NOW() WHERE room_item_id = ?";
        if ($stmt = $conn->prepare($sql)) {
            $stmt->bind_param("i", $room_item_id);
            $success = $stmt->execute();
            $stmt->close();
        }
    } else {
        $sql = "UPDATE pms_room_items SET quantity = quantity - ? WHERE room_item_id = ?";
        if ($stmt = $conn->prepare($sql)) {
            $stmt->bind_param("ii", $remove_quantity, $room_item_id);
            $success = $stmt->execute();
            $stmt->close();
        }
    }

    if ($success) {
        // Log to room items log with the specific quantity removed
        $logSql = "INSERT INTO pms_room_items_log (room_id, item_id, action, quantity, performed_by) 
                  VALUES (?, ?, 'removed', ?, ?)";
        if ($logStmt = $conn->prepare($logSql)) {
            $logStmt->bind_param("iiii", $room_id, $item_id, $remove_quantity, $user_id);
            $logStmt->execute();
            $logStmt->close();
        }

        $response['success'] = true;
        $response['message'] = "Successfully removed $remove_quantity unit(s) from the room.";
    } else {
        $response['message'] = "Error removing item: " . $conn->error;
    }
}

// ====================================================================
// GET AVAILABLE INVENTORY ITEMS (for adding to room)
// ====================================================================
elseif ($request_method === 'GET' && $action === 'get_available_items') {
    $category_id = intval($_GET['category_id'] ?? 0);
    
    $sql = "SELECT 
                i.ItemID,
                i.ItemName,
                i.ItemQuantity,
                i.ItemType,
                ic.ItemCategoryName
            FROM pms_inventory i
            JOIN pms_itemcategory ic ON i.ItemCategoryID = ic.ItemCategoryID
            WHERE i.is_archived = 0 AND i.ItemQuantity > 0";
    
    if ($category_id > 0) {
        $sql .= " AND i.ItemCategoryID = " . intval($category_id);
    }
    
    $sql .= " ORDER BY i.ItemName ASC";

    if ($result = $conn->query($sql)) {
        $items = [];
        while ($row = $result->fetch_assoc()) {
            $items[] = [
                'id' => $row['ItemID'],
                'name' => $row['ItemName'],
                'quantity' => $row['ItemQuantity'],
                'type' => $row['ItemType'],
                'category' => $row['ItemCategoryName']
            ];
        }
        $response['success'] = true;
        $response['data'] = $items;
    } else {
        $response['message'] = "Error fetching items: " . $conn->error;
    }
}

$conn->close();
echo json_encode($response);
?>