<?php
// inventory_actions.php

// 1. Start session
session_start([
  'cookie_httponly' => true,
  'cookie_secure' => isset($_SERVER['HTTPS']),
  'use_strict_mode' => true
]);

// 2. Database connection
require_once('db_connection.php');

// Force PHP and MySQL to use Manila Time for all timestamps
date_default_timezone_set('Asia/Manila');
$conn->query("SET time_zone = '+08:00'");

// 3. Auth Check
if (!isset($_SESSION['UserID'])) {
  header('Content-Type: application/json');
  echo json_encode(['error' => 'User not authenticated.']);
  exit();
}

$currentUserID = $_SESSION['UserID'];
$action = $_GET['action'] ?? '';

try {
  switch ($action) {
    // === ITEM ACTIONS ===
    case 'get_inventory':
      getInventory($conn);
      break;
    case 'get_history':
      getInventoryHistory($conn);
      break;
    case 'add_item':
      addItem($conn, $_POST, $currentUserID);
      break;
    case 'update_item':
      updateItem($conn, $_POST, $currentUserID);
      break;
    case 'issue_item':
      issueItem($conn, $_POST, $currentUserID);
      break;
    case 'delete_item': 
      archiveItem($conn, $_POST, $currentUserID);
      break;
    case 'restore_item':
      restoreItem($conn, $_POST, $currentUserID);
      break;
    
    // === CATEGORY ACTIONS ===
    case 'get_categories':
      getCategories($conn);
      break;
    case 'add_category':
      addCategory($conn, $_POST);
      break;
    case 'update_category':
      updateCategory($conn, $_POST);
      break;
    case 'archive_category':
      archiveCategory($conn, $_POST);
      break;
    case 'restore_category':
      restoreCategory($conn, $_POST);
      break;
    // === BUDGET ACTIONS ===
    case 'get_budget_requests':
      getBudgetRequests($conn);
      break;
    case 'add_budget_request':
      addBudgetRequest($conn, $_POST, $currentUserID);
      break;
    case 'delete_budget_request': // <-- ADDED THIS
      deleteBudgetRequest($conn, $_POST);
      break;
    default:
      http_response_code(400);
      echo json_encode(['error' => 'Invalid action specified.']);
  }
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}

$conn->close();

// ======================================================
// === ACTION FUNCTIONS ===
// ======================================================

function getInventory($conn) {
 $sql = "SELECT 
            i.ItemID, 
            i.ItemName, 
            i.ItemType,
            ic.ItemCategoryName AS Category,
            i.ItemQuantity, 
            i.ItemUnit,
            i.UnitCost,
            (i.ItemQuantity * i.UnitCost) AS TotalValue,
            i.StockLimit,
            i.ItemDescription, 
            CASE WHEN i.is_archived = 1 THEN 'Archived' ELSE i.ItemStatus END AS ItemStatus,
            DATE_FORMAT(i.DateofStockIn, '%Y-%m-%d') AS DateofStockIn, 
            DATE_FORMAT(i.ExpirationDate, '%Y-%m-%d') AS ExpirationDate,
            DATE_FORMAT(i.RestockDate, '%Y-%m-%d') AS RestockDate,
            ic.ItemCategoryID,
            i.is_archived
          FROM pms_inventory i
          JOIN pms_itemcategory ic ON i.ItemCategoryID = ic.ItemCategoryID
          ORDER BY i.ItemName";
  
  $result = $conn->query($sql);
  if (!$result) throw new Exception("Error fetching inventory: " . $conn->error);
  
  $items = [];
  while ($row = $result->fetch_assoc()) {
    $items[] = $row;
  }
  header('Content-Type: application/json');
  echo json_encode($items);
}

function getInventoryHistory($conn) {
  $sql = "SELECT 
            rt.InvLogID,
            i.ItemName,
            i.ItemType,   
            ic.ItemCategoryName AS Category,
            rt.Quantity AS QuantityChange, 
            (rt.NewQuantity - rt.Quantity) AS OldQuantity,
            rt.NewQuantity,
            i.ItemStatus,            
            CASE
                WHEN rt.ActionType = 'Initial Stock In' OR rt.ActionType = 'Stock Added'
                THEN DATE_FORMAT(i.DateofStockIn, '%Y-%m-%d')
                ELSE NULL
            END AS DateofStockIn,
            rt.ActionType,
            CONCAT(u.Fname, ' ', u.Lname) AS PerformedBy,
            rt.DateofRelease,
            rt.ItemID
          FROM (
              SELECT 
                  il.InvLogID,
                  il.ItemID,
                  il.UserID,
                  il.Quantity,
                  il.InventoryLogReason AS ActionType,
                  il.DateofRelease,
                  SUM(il.Quantity) OVER (
                      PARTITION BY il.ItemID 
                      ORDER BY il.InvLogID ASC
                  ) AS NewQuantity
              FROM pms_inventorylog il
          ) AS rt
          JOIN pms_inventory i ON rt.ItemID = i.ItemID
          JOIN pms_itemcategory ic ON i.ItemCategoryID = ic.ItemCategoryID
          JOIN pms_users u ON rt.UserID = u.UserID
          ORDER BY rt.InvLogID DESC";

  $result = $conn->query($sql);
  if (!$result) throw new Exception("Error fetching history: ". $conn->error);

  $logs = [];
  while ($row = $result->fetch_assoc()) {
    $logs[] = $row;
  }
  header('Content-Type: application/json');
  echo json_encode($logs);
}

function getCategories($conn) {
  // Added is_archived to SELECT
  $sql = "SELECT ItemCategoryID, ItemCategoryName, is_archived FROM pms_itemcategory ORDER BY ItemCategoryName";
  $result = $conn->query($sql);
  if (!$result) throw new Exception("Error fetching categories: ". $conn->error);

  $categories = [];
  while ($row = $result->fetch_assoc()) {
    $categories[] = $row;
  }
  header('Content-Type: application/json');
  echo json_encode($categories);
}

function addItem($conn, $data, $userID) {
  $name = trim($data['name'] ?? '');
  $type = trim($data['type'] ?? '');
  $description = trim($data['description'] ?? '');
  $stockInDate = trim($data['stock_in_date'] ?? '');
  $expirationDate = !empty($data['expiration_date']) ? trim($data['expiration_date']) : NULL;
  $categoryID = (int)($data['category_id'] ?? 0); 
  $quantity = (int)($data['quantity'] ?? 0);
  $unit = trim($data['unit'] ?? ''); // Unit is not required
  $unitCost = !empty($data['unit_cost']) ? (float)$data['unit_cost'] : 0.00;
  $stockLimit = (int)($data['stock_limit'] ?? 1);

  if (empty($name) || $categoryID <= 0 || empty($stockInDate)) throw new Exception("Invalid data.");
  if ($stockLimit < 1) throw new Exception("Stock Limit must be at least 1.");
  if ($type === 'Consumables' && empty($expirationDate)) throw new Exception("Expiration date is required for Consumables.");

  $status = 'In Stock';
  $yellowThreshold = $stockLimit / 2;
  $orangeThreshold = $stockLimit / 4;
  
  // NEVER set a restock date on Add Item
  $restockDate = NULL; 

  if ($quantity <= 0) {
    $status = 'Out of Stock';
  } elseif ($quantity <= $orangeThreshold) { 
    $status = 'Critical';
  } elseif ($quantity <= $yellowThreshold) { 
    $status = 'Threshold';
  }

  $conn->begin_transaction();

  $stmt = $conn->prepare(
    "INSERT INTO pms_inventory (ItemName, ItemType, ItemCategoryID, ItemQuantity, ItemUnit, UnitCost, ItemDescription, ItemStatus, DateofStockIn, ExpirationDate, RestockDate, StockLimit) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  
  $bindString = "ssiisdsssssi";
  $stmt->bind_param($bindString, $name, $type, $categoryID, $quantity, $unit, $unitCost, $description, $status, $stockInDate, $expirationDate, $restockDate, $stockLimit);
  
  if (!$stmt->execute()) {
    $conn->rollback();
    throw new Exception("Error adding item: ". $stmt->error);
  }

  $newItemID = $conn->insert_id;

  $logReason = "Initial Stock In";
  $logStmt = $conn->prepare(
    "INSERT INTO pms_inventorylog (UserID, ItemID, Quantity, InventoryLogReason, DateofRelease) 
     VALUES (?, ?, ?, ?, NOW())"
  );
  $logStmt->bind_param("iiis", $userID, $newItemID, $quantity, $logReason);

  if (!$logStmt->execute()) {
    $conn->rollback();
    throw new Exception("Error logging item creation: ". $logStmt->error);
  }

  $conn->commit();
  header('Content-Type: application/json');
  echo json_encode(['success' => true, 'message' => 'Item added successfully.', 'new_item_id' => $newItemID]);
}
function updateItem($conn, $data, $userID) {
  $itemID = (int)($data['item_id'] ?? 0);
  $name = trim($data['name'] ?? '');
  $type = trim($data['type'] ?? '');
  $description = trim($data['description'] ?? '');
  $expirationDate = !empty($data['expiration_date']) ? trim($data['expiration_date']) : NULL;
  $categoryID = (int)($data['category_id'] ?? 0);
  $stockAdjustment = (int)($data['stock_adjustment'] ?? 0);
  $unit = trim($data['unit'] ?? ''); 
  $unitCost = !empty($data['unit_cost']) ? (float)$data['unit_cost'] : 0.00;
  $stockLimit = (int)($data['stock_limit'] ?? 1);

  if (empty($name) || $categoryID <= 0 || $itemID <= 0) throw new Exception("Invalid data.");
  if ($type === 'Consumables' && empty($expirationDate)) throw new Exception("Expiration required for Consumables.");
  
  $conn->begin_transaction();

  $currentQuantity = 0;
  $currentRestockDate = NULL;

  $qtyStmt = $conn->prepare("SELECT ItemQuantity, RestockDate FROM pms_inventory WHERE ItemID = ?");
  $qtyStmt->bind_param("i", $itemID);

  if ($qtyStmt->execute()) {
    $result = $qtyStmt->get_result();
    if ($row = $result->fetch_assoc()) {
      $currentQuantity = (int)$row['ItemQuantity'];
      $currentRestockDate = $row['RestockDate'];
    } else {
       $conn->rollback();
       throw new Exception("Item with ID $itemID not found.");
    }
  } else {
    $conn->rollback();
    throw new Exception("Error fetching current item state: ". $qtyStmt->error);
  }
  $qtyStmt->close();
  
  if ($currentQuantity < abs($stockAdjustment)) {
      $conn->rollback();
      throw new Exception("Not enough stock. Only $currentQuantity item(s) available.");
  }

  $newQuantity = $currentQuantity + $stockAdjustment;
  
  $status = 'In Stock';
  $yellowThreshold = $stockLimit / 2;
  $orangeThreshold = $stockLimit / 4;
  $restockDate = NULL;

  // Auto 2-Weeks Restock Date Logic
  if ($newQuantity <= 0 || $newQuantity <= $yellowThreshold) {
      if ($newQuantity <= 0) $status = 'Out of Stock';
      else if ($newQuantity <= $orangeThreshold) $status = 'Critical';
      else $status = 'Threshold';

      $restockDate = $currentRestockDate ? $currentRestockDate : date('Y-m-d', strtotime('+14 days'));
  }

  $stmt = $conn->prepare(
    "UPDATE pms_inventory 
     SET ItemName = ?, ItemType = ?, ItemCategoryID = ?, ItemDescription = ?, 
         ItemQuantity = ?, ItemUnit = ?, UnitCost = ?, ItemStatus = ?, ExpirationDate = ?, RestockDate = ?, StockLimit = ?
     WHERE ItemID = ?"
  );

  // EXACT Bind String so it correctly saves Strings and Numbers
  $bindString = "ssisisdsssii"; 
  $stmt->bind_param($bindString, $name, $type, $categoryID, $description, $newQuantity, $unit, $unitCost, $status, $expirationDate, $restockDate, $stockLimit, $itemID);

  if (!$stmt->execute()) {
    $conn->rollback();
    throw new Exception("Error updating item quantity: ". $stmt->error);
  }

  if ($stockAdjustment != 0) {
    $logStmt = $conn->prepare("INSERT INTO pms_inventorylog (UserID, ItemID, Quantity, InventoryLogReason, DateofRelease) VALUES (?, ?, ?, 'Stock Added', NOW())");
    $logStmt->bind_param("iii", $userID, $itemID, $stockAdjustment);
    $logStmt->execute();
  }

  $conn->commit();
  header('Content-Type: application/json');
  echo json_encode(['success' => true, 'message' => 'Item updated successfully.']);
}

function issueItem($conn, $data, $userID) {
  $itemID = (int)($data['item_id'] ?? 0);
  $stockAdjustment = (int)($data['stock_adjustment'] ?? 0);
  $logReason = trim($data['log_reason'] ?? 'Item Issued');
  
  if (empty($logReason)) $logReason = 'Item Issued';
  if ($stockAdjustment >= 0) throw new Exception("Issue action requires a negative stock adjustment.");
  if ($itemID <= 0) throw new Exception("Invalid item ID.");

  $conn->begin_transaction();

  $currentQuantity = 0;
  $stockLimit = 1;
  $currentRestockDate = NULL;

  $qtyStmt = $conn->prepare("SELECT ItemQuantity, StockLimit, RestockDate FROM pms_inventory WHERE ItemID = ?");
  $qtyStmt->bind_param("i", $itemID);

  if ($qtyStmt->execute()) {
    $result = $qtyStmt->get_result();
    if ($row = $result->fetch_assoc()) {
      $currentQuantity = (int)$row['ItemQuantity'];
      $stockLimit = (int)$row['StockLimit'];
      $currentRestockDate = $row['RestockDate'];
    } else {
       $conn->rollback();
       throw new Exception("Item with ID $itemID not found.");
    }
  } else {
    $conn->rollback();
    throw new Exception("Error fetching current item state: ". $qtyStmt->error);
  }
  $qtyStmt->close();
  
  if ($currentQuantity < abs($stockAdjustment)) {
      $conn->rollback();
      throw new Exception("Not enough stock. Only $currentQuantity item(s) available.");
  }

  $newQuantity = $currentQuantity + $stockAdjustment;
  
  $status = 'In Stock';
  $yellowThreshold = $stockLimit / 2;
  $orangeThreshold = $stockLimit / 4;
  $restockDate = NULL;

  // Auto 2-Weeks Restock Date Logic
  if ($newQuantity <= 0 || $newQuantity <= $yellowThreshold) {
      if ($newQuantity <= 0) $status = 'Out of Stock';
      else if ($newQuantity <= $orangeThreshold) $status = 'Critical';
      else $status = 'Threshold';

      $restockDate = $currentRestockDate ? $currentRestockDate : date('Y-m-d', strtotime('+14 days'));
  }

  $stmt = $conn->prepare("UPDATE pms_inventory SET ItemQuantity = ?, ItemStatus = ?, RestockDate = ? WHERE ItemID = ?");
  $stmt->bind_param("issi", $newQuantity, $status, $restockDate, $itemID);

  if (!$stmt->execute()) {
    $conn->rollback();
    throw new Exception("Error updating item quantity: ". $stmt->error);
  }

  $logStmt = $conn->prepare(
    "INSERT INTO pms_inventorylog (UserID, ItemID, Quantity, InventoryLogReason, DateofRelease) 
     VALUES (?, ?, ?, ?, NOW())"
  );
  $logStmt->bind_param("iiis", $userID, $itemID, $stockAdjustment, $logReason);

  if (!$logStmt->execute()) {
    $conn->rollback();
    throw new Exception("Error logging stock issue: ". $logStmt->error);
  }

  $conn->commit();
  header('Content-Type: application/json');
  echo json_encode(['success' => true, 'message' => 'Item issued successfully.']);
}

function archiveItem($conn, $data, $userID) {
  $itemID = (int)$data['item_id'];
  if ($itemID <= 0) throw new Exception("Invalid item ID.");

  $conn->begin_transaction();
  $stmt = $conn->prepare("UPDATE pms_inventory SET is_archived = 1 WHERE ItemID = ?");
  $stmt->bind_param("i", $itemID);
  if (!$stmt->execute()) {
    $conn->rollback();
    throw new Exception("Error archiving item: ". $stmt->error);
  }
  $conn->commit();
  header('Content-Type: application/json');
  echo json_encode(['success' => true, 'message' => 'Item has been archived successfully.']);
}

function restoreItem($conn, $data, $userID) {
  $itemID = (int)$data['item_id'];
  if ($itemID <= 0) throw new Exception("Invalid item ID.");

  $conn->begin_transaction();
  $stmt = $conn->prepare("UPDATE pms_inventory SET is_archived = 0 WHERE ItemID = ?");
  $stmt->bind_param("i", $itemID);
  if (!$stmt->execute()) {
    $conn->rollback();
    throw new Exception("Error restoring item: ". $stmt->error);
  }
  $conn->commit();
  header('Content-Type: application/json');
  echo json_encode(['success' => true, 'message' => 'Item has been restored successfully.']);
}

// ======================================================
// === CATEGORY FUNCTIONS ===
// ======================================================

function addCategory($conn, $data) {
    header('Content-Type: application/json');
    // *** REMOVED htmlspecialchars, KEPT trim ***
    $name = trim($data['CategoryName'] ?? '');

    if (empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Category name cannot be empty.']);
        return;
    }

    $checkStmt = $conn->prepare("SELECT 1 FROM pms_itemcategory WHERE ItemCategoryName = ?");
    $checkStmt->bind_param("s", $name);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'This category already exists.']);
        return;
    }
    $checkStmt->close();

    $stmt = $conn->prepare("INSERT INTO pms_itemcategory (ItemCategoryName, is_archived) VALUES (?, 0)");
    $stmt->bind_param("s", $name);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Category added successfully.']);
    } else {
        throw new Exception("Error adding category: ". $stmt->error);
    }
    $stmt->close();
}

function updateCategory($conn, $data) {
    header('Content-Type: application/json');
    $id = (int)($data['CategoryID'] ?? 0);
    // *** REMOVED htmlspecialchars, KEPT trim ***
    $name = trim($data['CategoryName'] ?? '');

    if ($id <= 0 || empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Both Category ID and Name are required.']);
        return;
    }

    $checkStmt = $conn->prepare("SELECT 1 FROM pms_itemcategory WHERE ItemCategoryName = ? AND ItemCategoryID != ?");
    $checkStmt->bind_param("si", $name, $id);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'This category name is already in use.']);
        return;
    }
    $checkStmt->close();

    $stmt = $conn->prepare("UPDATE pms_itemcategory SET ItemCategoryName = ? WHERE ItemCategoryID = ?");
    $stmt->bind_param("si", $name, $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Category updated.']);
    } else {
        throw new Exception("Error updating category: ". $stmt->error);
    }
    $stmt->close();
}

function archiveCategory($conn, $data) {
    header('Content-Type: application/json');
    $id = (int)($data['CategoryID'] ?? 0);

    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Category ID is required.']);
        return;
    }

    $stmt = $conn->prepare("UPDATE pms_itemcategory SET is_archived = 1 WHERE ItemCategoryID = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Category archived successfully.']);
    } else {
        throw new Exception("Error archiving category: ". $stmt->error);
    }
    $stmt->close();
}

function restoreCategory($conn, $data) {
    header('Content-Type: application/json');
    $id = (int)($data['CategoryID'] ?? 0);

    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Category ID is required.']);
        return;
    }

    $stmt = $conn->prepare("UPDATE pms_itemcategory SET is_archived = 0 WHERE ItemCategoryID = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Category restored successfully.']);
    } else {
        throw new Exception("Error restoring category: ". $stmt->error);
    }
    $stmt->close();
}

// ==========================================
// === BUDGET REQUEST ACTIONS (DUAL-INSERT) ===
// ==========================================

function getBudgetRequests($conn) {
    $sql = "SELECT br.*, CONCAT(u.Fname, ' ', u.Lname) AS RequestedByName 
            FROM pms_budget_requests br 
            JOIN pms_users u ON br.RequestedBy = u.UserID 
            ORDER BY br.RequestDate DESC";
            
    $result = $conn->query($sql);
    $requests = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) { 
            $requests[] = $row; 
        }
    }
    
    header('Content-Type: application/json');
    echo json_encode($requests);
}

function addBudgetRequest($conn, $data, $userID) {
    $itemID = !empty($data['item_id']) ? (int)$data['item_id'] : NULL;
    $itemName = trim($data['item_name'] ?? '');
    $description = trim($data['description'] ?? '');
    $qty = (int)($data['quantity'] ?? 0);
    $unitCost = (float)($data['unit_cost'] ?? 0);
    $priorityUI = trim($data['priority'] ?? 'Low'); 
    $remarks = trim($data['remarks'] ?? '');
    
    if (empty($itemName) || $qty <= 0) throw new Exception("Invalid request details.");
    
    $totalAmount = $qty * $unitCost;
    $dbPriority = strtolower($priorityUI); 

    $stmtUser = $conn->prepare("SELECT Fname, Lname, AccountType FROM pms_users WHERE UserID = ?");
    if ($stmtUser) {
        $stmtUser->bind_param("i", $userID);
        $stmtUser->execute();
        $userRow = $stmtUser->get_result()->fetch_assoc();
        $requesterName = $userRow ? trim($userRow['Fname'] . ' ' . $userRow['Lname']) : 'InventoryManager';
        if (empty($requesterName)) $requesterName = $userRow['AccountType'] ?? 'InventoryManager';
        $stmtUser->close();
    } else {
        $requesterName = 'InventoryManager';
    }

    $conn->begin_transaction();

    if ($itemID === NULL) {
        $stmt1 = $conn->prepare(
            "INSERT INTO pms_budget_requests (ItemName, RequestedQty, UnitCost, TotalAmount, Priority, RequestedBy, Remarks) 
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        if (!$stmt1) { $conn->rollback(); throw new Exception("Inventory Table Error: " . $conn->error); }
        $stmt1->bind_param("siddsis", $itemName, $qty, $unitCost, $totalAmount, $priorityUI, $userID, $remarks);
    } else {
        $stmt1 = $conn->prepare(
            "INSERT INTO pms_budget_requests (ItemID, ItemName, RequestedQty, UnitCost, TotalAmount, Priority, RequestedBy, Remarks) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );
        if (!$stmt1) { $conn->rollback(); throw new Exception("Inventory Table Error: " . $conn->error); }
        $stmt1->bind_param("isiddsis", $itemID, $itemName, $qty, $unitCost, $totalAmount, $priorityUI, $userID, $remarks);
    }
    
    if (!$stmt1->execute()) {
        $conn->rollback();
        throw new Exception("Error saving budget request: " . $stmt1->error);
    }
    
    $requestID = $conn->insert_id;
    $extRef = "INV-REQ-" . $requestID;

    $notifTitle = $itemName;
    $deptId = 2; 

    $stmt2 = $conn->prepare(
        "INSERT INTO expense_notifications (external_reference_id, title, description, requested_amount, requested_by, purpose, priority, status, department_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)"
    );
    
    if (!$stmt2) {
        $conn->rollback();
        $errorMsg = $conn->error ? $conn->error : "Unknown SQL Prepare Error. Check column names.";
        throw new Exception("Finance Table Prepare Error: " . $errorMsg);
    }
    
    $stmt2->bind_param("sssdsssi", $extRef, $notifTitle, $description, $totalAmount, $requesterName, $remarks, $dbPriority, $deptId);
    
    if (!$stmt2->execute()) {
        $conn->rollback();
        throw new Exception("Finance Table Execute Error: " . $stmt2->error);
    }

    $conn->commit();
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => 'Budget requested successfully.']);
}

function deleteBudgetRequest($conn, $data) {
    $requestID = (int)($data['request_id'] ?? 0);
    if ($requestID <= 0) throw new Exception("Invalid request ID.");

    $conn->begin_transaction();

    $stmt1 = $conn->prepare("DELETE FROM pms_budget_requests WHERE RequestID = ? AND Status = 'Pending'");
    if (!$stmt1) { $conn->rollback(); throw new Exception("Inv Delete Error: " . $conn->error); }
    $stmt1->bind_param("i", $requestID);
    
    if (!$stmt1->execute()) {
        $conn->rollback();
        throw new Exception("Error deleting request: " . $stmt1->error);
    }
    
    if ($stmt1->affected_rows === 0) {
        $conn->rollback();
        throw new Exception("Request cannot be deleted. It may have already been accepted or rejected.");
    }

    $extRef = "INV-REQ-" . $requestID;
    
    $stmt2 = $conn->prepare("DELETE FROM expense_notifications WHERE external_reference_id = ? AND status = 'pending'");
    if (!$stmt2) { $conn->rollback(); throw new Exception("Finance Delete Error: " . $conn->error); }
    $stmt2->bind_param("s", $extRef);
    
    if (!$stmt2->execute()) {
        $conn->rollback();
        throw new Exception("Error deleting Finance notification: " . $stmt2->error);
    }

    $conn->commit();
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => 'Budget request cancelled.']);
}
?>