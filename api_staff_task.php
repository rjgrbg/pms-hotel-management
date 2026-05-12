<?php
// Allow requests from your frontend development server
header("Access-Control-Allow-Origin: *"); // Use "*" for dev, lock to domain in prod
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

// This file ONLY connects to the DB. It does NOT check for a login session.
require_once('db_connection.php');

// Get single database connection
$conn = get_db_connection('bt3wljbwprykeblz7tvq');

if ($conn === null) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection error.']);
    exit;
}

// *** Logging Function ***
function logMaintenanceAction($conn, $requestId, $roomId, $userId, $action, $details) {
    try {
        // This is secure, uses prepared statements.
        $stmt = $conn->prepare(
            "INSERT INTO pms_maintenance_logs (RequestID, RoomID, UserID, Action, Details) 
             VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("iiiss", $requestId, $roomId, $userId, $action, $details);
        $stmt->execute();
    } catch (Exception $e) {
        // Log the error but don't stop the main process
        error_log("Failed to log maintenance action: " . $e->getMessage());
    }
}
// ===== END OF HELPER FUNCTION =====


// Get the incoming JSON data
$data = json_decode(file_get_contents('php://input'), true);
$action = ''; // Initialize action

if (!$data) {
    // Allow GET requests for fetching details
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
        $action = trim($_GET['action'] ?? '');
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid request.']);
        exit;
    }
} else {
    $action = trim($data['action'] ?? '');
}

switch ($action) {

    // ===== GET TASK DETAILS (for mt_assign_staff.html) =====
    case 'get_task_details':
        $requestId = filter_var($_GET['request_id'] ?? null, FILTER_VALIDATE_INT);
        if ($requestId === false || $requestId === null) {
            echo json_encode(['status' => 'error', 'message' => 'Request ID missing or invalid.']);
            exit;
        }

        $response = ['status' => 'error', 'message' => 'Task not found.']; // Default error

        // --- SECURE: Uses prepared statement ---
        $sql = "SELECT 
                    mr.RequestID, mr.Status, mr.IssueType, mr.Remarks, mr.RoomID,
                    DATE_FORMAT(mr.DateRequested, '%m/%d/%Y') as DateRequested,
                    DATE_FORMAT(mr.DateRequested, '%l:%i %p') as TimeRequested,
                    r.room_num as RoomNumber, r.room_type as RoomType
                FROM 
                    pms_maintenance_requests mr
                JOIN 
                    tbl_rooms r ON mr.RoomID = r.room_id
                WHERE 
                    mr.RequestID = ? AND mr.Status IN ('Pending', 'In Progress')";
        
        if ($stmt = $conn->prepare($sql)) {
            $stmt->bind_param("i", $requestId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($data = $result->fetch_assoc()) {
                $response = ['status' => 'success', 'data' => $data];
            } else {
                $response['message'] = 'Task not found, or it is already completed/cancelled.';
            }
            $stmt->close();
        } else {
            $response['message'] = 'Database query error.';
        }
        echo json_encode($response);
        break;

    // ===== UPDATE TASK STATUS (for mt_assign_staff.html) =====
    case 'update_task_status':
        $taskData = $data['data'] ?? [];
        
        $requestId = filter_var($taskData['request_id'] ?? null, FILTER_VALIDATE_INT);
        $newStatus = trim($taskData['status'] ?? '');
        $remarks = trim($taskData['remarks'] ?? ''); 
        $usedItems = $taskData['used_items'] ?? []; // Grabs the inventory items from JS
        $usedElectricalItems = $taskData['used_electrical'] ?? []; // Electrical items selected
        $usedFurnitureItems = $taskData['used_furniture'] ?? []; // Furniture items selected

        if ($requestId === false || $requestId === null || empty($newStatus)) {
             echo json_encode(['status' => 'error', 'message' => 'Invalid task data provided.']);
             exit;
        }

        $response = ['status' => 'error', 'message' => 'Failed to update status.'];

        try {
            // Start transaction
            $conn->begin_transaction();
            
            // --- SECURE: Prepared statement ---
            $stmt_info = $conn->prepare("SELECT RoomID, AssignedUserID FROM pms_maintenance_requests WHERE RequestID = ?");
            $stmt_info->bind_param("i", $requestId);
            $stmt_info->execute();
            $result_info = $stmt_info->get_result();
            $request_data = $result_info->fetch_assoc();
            
            if (!$request_data) {
                throw new Exception("Request not found.");
            }
            
            $roomId = $request_data['RoomID'];
            $staffId = $request_data['AssignedUserID']; // This is the staff member's UserID
            $logDetails = "";

            $sql = "";
            // --- SECURE: All inputs are bound ---
            if ($newStatus === 'Completed') {
                $sql = "UPDATE pms_maintenance_requests 
                        SET Status = ?, DateCompleted = NOW(), Remarks = ?
                        WHERE RequestID = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ssi", $newStatus, $remarks, $requestId);
                $logDetails = "Task completed by staff (ID: $staffId). Remarks: $remarks";
            
            } else { // 'In Progress'
                $sql = "UPDATE pms_maintenance_requests 
                        SET Status = ?, Remarks = ?
                        WHERE RequestID = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ssi", $newStatus, $remarks, $requestId);
                $logDetails = "Status set to 'In Progress' by staff (ID: $staffId). Remarks: $remarks";
            }
            
            $stmt->execute();
            $stmt->close(); // Close statement

            if ($newStatus === 'Completed') {
                // --- Set staff back to 'Available' ---
                if ($staffId) {
                    $stmt_status = $conn->prepare("UPDATE pms_users SET AvailabilityStatus = 'Available' WHERE UserID = ?");
                    $stmt_status->bind_param("i", $staffId);
                    $stmt_status->execute();
                    $stmt_status->close();
                }

                // --- Get RoomNumber (using room_id from tbl_rooms) ---
                $stmt_room = $conn->prepare("SELECT room_num FROM tbl_rooms WHERE room_id = ?");
                $stmt_room->bind_param("i", $roomId);
                $stmt_room->execute();
                $room_data = $stmt_room->get_result()->fetch_assoc();
                $stmt_room->close();
                
                if ($room_data) {
                    $roomNumber = $room_data['room_num'];
                    
                    // *** Update LastMaintenance Date ***
                    $stmt_last_maint = $conn->prepare(
                        "UPDATE pms_room_status SET LastMaintenance = NOW() WHERE RoomNumber = ?"
                    );
                    $stmt_last_maint->bind_param("i", $roomNumber);
                    $stmt_last_maint->execute();
                    $stmt_last_maint->close();

                    // --- Check for other active tasks for this room ---
                    $stmt_check_other_tasks = $conn->prepare(
                        "SELECT COUNT(*) as active_tasks 
                         FROM pms_maintenance_requests 
                         WHERE RoomID = ? AND Status IN ('Pending', 'In Progress')"
                    );
                    $stmt_check_other_tasks->bind_param("i", $roomId);
                    $stmt_check_other_tasks->execute();
                    $result_check = $stmt_check_other_tasks->get_result()->fetch_assoc();
                    $stmt_check_other_tasks->close();

                    // --- Only set to Available if no other active tasks exist ---
                    if ($result_check['active_tasks'] == 0) {
                        $stmt_room_status = $conn->prepare(
                            "UPDATE pms_room_status SET RoomStatus = 'Available' WHERE RoomNumber = ?"
                        );
                        $stmt_room_status->bind_param("i", $roomNumber);
                        $stmt_room_status->execute();
                        $stmt_room_status->close();
                    }
                }
                
                // --- NEW: Deduct Inventory Items (ONLY HAPPENS ON DONE) ---
                if (!empty($usedItems) && is_array($usedItems)) {
                    foreach ($usedItems as $item) {
                        $itemId = filter_var($item['id'] ?? 0, FILTER_VALIDATE_INT);
                        $qty = filter_var($item['qty'] ?? 0, FILTER_VALIDATE_INT);
                        $itemName = trim($item['name'] ?? '');
                        
                        if ($itemId > 0 && $qty > 0) {
                            $stmt_inv = $conn->prepare("SELECT ItemQuantity, StockLimit, RestockDate FROM pms_inventory WHERE ItemID = ?");
                            $stmt_inv->bind_param("i", $itemId);
                            $stmt_inv->execute();
                            $inv_row = $stmt_inv->get_result()->fetch_assoc();
                            $stmt_inv->close();

                            if ($inv_row && $inv_row['ItemQuantity'] >= $qty) {
                                $newQuantity = $inv_row['ItemQuantity'] - $qty;
                                $stockLimit = (float)$inv_row['StockLimit'];
                                $currentRestockDate = $inv_row['RestockDate'];
                                
                                $status = 'In Stock';
                                $yellowThreshold = $stockLimit / 2;
                                $orangeThreshold = $stockLimit / 4;
                                $restockDate = NULL;

                                if ($newQuantity <= 0 || ($stockLimit > 0 && $newQuantity <= $yellowThreshold)) {
                                    if ($newQuantity <= 0) $status = 'Out of Stock';
                                    else if ($newQuantity <= $orangeThreshold) $status = 'Critical';
                                    else $status = 'Threshold';
                                    $restockDate = !empty($currentRestockDate) ? $currentRestockDate : date('Y-m-d', strtotime('+7 days'));
                                }

                                if ($restockDate === NULL) {
                                    $stmt_update_inv = $conn->prepare("UPDATE pms_inventory SET ItemQuantity = ?, ItemStatus = ?, RestockDate = NULL WHERE ItemID = ?");
                                    $stmt_update_inv->bind_param("isi", $newQuantity, $status, $itemId);
                                } else {
                                    $stmt_update_inv = $conn->prepare("UPDATE pms_inventory SET ItemQuantity = ?, ItemStatus = ?, RestockDate = ? WHERE ItemID = ?");
                                    $stmt_update_inv->bind_param("issi", $newQuantity, $status, $restockDate, $itemId);
                                }
                                $stmt_update_inv->execute();
                                $stmt_update_inv->close();

                                $logReason = "Used for MT Task #$requestId (Room $roomId)";
                                $safeStaffId = (int)$staffId;
                                $qtyChange = -$qty;
                                $stmt_log = $conn->prepare("INSERT INTO pms_inventorylog (UserID, ItemID, Quantity, InventoryLogReason, DateofRelease) VALUES (?, ?, ?, ?, NOW())");
                                $stmt_log->bind_param("iiis", $safeStaffId, $itemId, $qtyChange, $logReason);
                                $stmt_log->execute();
                                $stmt_log->close();
                                
                                $logDetails .= " | Used: $qty x $itemName";
                            }
                        }
                    }
                }
                
                // --- Update last_maintained for electrical items ---
                if (!empty($usedElectricalItems) && is_array($usedElectricalItems)) {
                    foreach ($usedElectricalItems as $item) {
                        $itemId = filter_var($item['id'] ?? 0, FILTER_VALIDATE_INT);
                        $roomItemId = filter_var($item['room_item_id'] ?? 0, FILTER_VALIDATE_INT);
                        
                        if ($roomItemId > 0) {
                            $stmt_electrical = $conn->prepare(
                                "UPDATE pms_room_items SET last_maintained = NOW() 
                                 WHERE room_item_id = ? AND date_removed IS NULL"
                            );
                            $stmt_electrical->bind_param("i", $roomItemId);
                            $stmt_electrical->execute();
                            $stmt_electrical->close();
                        } else if ($itemId > 0) {
                            $stmt_electrical = $conn->prepare(
                                "UPDATE pms_room_items SET last_maintained = NOW() 
                                 WHERE room_id = ? AND item_id = ? AND date_removed IS NULL"
                            );
                            $stmt_electrical->bind_param("ii", $roomId, $itemId);
                            $stmt_electrical->execute();
                            $stmt_electrical->close();
                        }
                        
                        $logDetails .= " | Maintained: Electrical Item ID $itemId";
                    }
                }

                // --- Update last_maintained for furniture items ---
                if (!empty($usedFurnitureItems) && is_array($usedFurnitureItems)) {
                    foreach ($usedFurnitureItems as $item) {
                        $itemId = filter_var($item['id'] ?? 0, FILTER_VALIDATE_INT);
                        $roomItemId = filter_var($item['room_item_id'] ?? 0, FILTER_VALIDATE_INT);
                        
                        if ($roomItemId > 0) {
                            $stmt_furniture = $conn->prepare(
                                "UPDATE pms_room_items SET last_maintained = NOW() 
                                 WHERE room_item_id = ? AND date_removed IS NULL"
                            );
                            $stmt_furniture->bind_param("i", $roomItemId);
                            $stmt_furniture->execute();
                            $stmt_furniture->close();
                        } else if ($itemId > 0) {
                            $stmt_furniture = $conn->prepare(
                                "UPDATE pms_room_items SET last_maintained = NOW() 
                                 WHERE room_id = ? AND item_id = ? AND date_removed IS NULL"
                            );
                            $stmt_furniture->bind_param("ii", $roomId, $itemId);
                            $stmt_furniture->execute();
                            $stmt_furniture->close();
                        }
                        
                        $logDetails .= " | Maintained: Furniture Item ID $itemId";
                    }
                }
            }
            
            // *** Log the action ***
            logMaintenanceAction($conn, $requestId, $roomId, $staffId, strtoupper($newStatus), $logDetails);

            // Commit transaction
            $conn->commit();
                
            $response = ['status' => 'success', 'message' => 'Status updated.'];

        } catch (Exception $e) {
            $conn->rollback();
            $response['message'] = $e->getMessage();
        }
        
        echo json_encode($response);
        break;
        
    // ===== GET INVENTORY ITEMS (for mt_assign_staff.html) =====
    case 'get_inventory':
        $itemType = $_GET['item_type'] ?? null;
        $roomId = $_GET['room_id'] ?? null;
        
        // EQUIPMENT: Fetch available items belonging ONLY to Appliances, Electronics, and Furniture
        if ($itemType === 'Equipment') {
            $sql = "SELECT 
                        i.ItemID, 
                        i.ItemName, 
                        ic.ItemCategoryName AS Category,
                        i.ItemQuantity,
                        i.is_archived
                    FROM pms_inventory i
                    JOIN pms_itemcategory ic ON i.ItemCategoryID = ic.ItemCategoryID
                    WHERE i.is_archived = 0 AND i.ItemQuantity > 0
                    AND ic.ItemCategoryName IN ('Appliances', 'Electronics', 'Furniture')
                    ORDER BY ic.ItemCategoryName, i.ItemName";
            
            if ($stmt = $conn->prepare($sql)) {
                $stmt->execute();
                $result = $stmt->get_result();
                $items = [];
                while ($row = $result->fetch_assoc()) {
                    $items[] = $row;
                }
                $stmt->close();
                echo json_encode($items);
            } else {
                echo json_encode([]);
            }
            exit;
        }
        // FURNITURE & FIXTURES and ELECTRICAL & LIGHTING: Fetch from room-assigned items only
        else if ($roomId) {
            $roomId = filter_var($roomId, FILTER_VALIDATE_INT);
            
            // Base query for items assigned to the room
            $sql = "SELECT 
                        ri.room_item_id,
                        i.ItemID, 
                        i.ItemName, 
                        ic.ItemCategoryName AS Category,
                        ri.quantity AS ItemQuantity,
                        ri.last_maintained,
                        ri.date_assigned
                    FROM pms_room_items ri
                    JOIN pms_inventory i ON ri.item_id = i.ItemID
                    JOIN pms_itemcategory ic ON i.ItemCategoryID = ic.ItemCategoryID
                    WHERE ri.room_id = ? AND ri.date_removed IS NULL";
            
            // Filter by category if specific type requested
            if ($itemType === 'Electrical & Lighting') {
                $sql .= " AND ic.ItemCategoryName IN ('Appliances', 'Electronics')";
            } else if ($itemType === 'Furniture & Fixtures') {
                $sql .= " AND ic.ItemCategoryName = 'Furniture'";
            }
            
            $sql .= " ORDER BY ic.ItemCategoryName, i.ItemName";
            
            if ($stmt = $conn->prepare($sql)) {
                $stmt->bind_param("i", $roomId);
                $stmt->execute();
                $result = $stmt->get_result();
                $items = [];
                while ($row = $result->fetch_assoc()) {
                    $items[] = $row;
                }
                $stmt->close();
                echo json_encode($items);
            } else {
                echo json_encode(['error' => 'Failed to fetch room items: ' . $conn->error]);
            }
        }
        break;
        
    default:
        echo json_encode(['status' => 'error', 'message' => 'Unknown action.']);
        break;
}

$conn->close();
?>