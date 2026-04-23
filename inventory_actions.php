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
  // Added AvailableBudget to the SELECT statement
  $sql = "SELECT ItemCategoryID, ItemCategoryName, is_archived, AvailableBudget FROM pms_itemcategory ORDER BY ItemCategoryName";
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
// Deduct from budget and create log!
  deductStockPurchase($conn, $categoryID, $name, $quantity, $unitCost, $userID);
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

  // Auto 1-Week Restock Date Logic
  if ($newQuantity <= 0 || $newQuantity <= $yellowThreshold) {
      if ($newQuantity <= 0) $status = 'Out of Stock';
      else if ($newQuantity <= $orangeThreshold) $status = 'Critical';
      else $status = 'Threshold';

      $restockDate = $currentRestockDate ? $currentRestockDate : date('Y-m-d', strtotime('+7 days'));
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
// Deduct from budget and create log!
  if ($stockAdjustment > 0) {
      deductStockPurchase($conn, $categoryID, $name, $stockAdjustment, $unitCost, $userID);
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

  // Auto 1-Week Restock Date Logic
  if ($newQuantity <= 0 || $newQuantity <= $yellowThreshold) {
      if ($newQuantity <= 0) $status = 'Out of Stock';
      else if ($newQuantity <= $orangeThreshold) $status = 'Critical';
      else $status = 'Threshold';

      $restockDate = $currentRestockDate ? $currentRestockDate : date('Y-m-d', strtotime('+7 days'));
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
// HELPER: Deduct money when stock is purchased and log it
function deductStockPurchase($conn, $categoryID, $itemName, $qty, $unitCost, $userID) {
    if ($qty <= 0 || $unitCost <= 0) return;
    $totalCost = $qty * $unitCost;

    // 1. Get current budget and deduct
    $stmtCat = $conn->prepare("SELECT AvailableBudget, ItemCategoryName FROM pms_itemcategory WHERE ItemCategoryID = ? FOR UPDATE");
    $stmtCat->bind_param("i", $categoryID);
    $stmtCat->execute();
    $catRow = $stmtCat->get_result()->fetch_assoc();
    $currentBudget = $catRow ? (float)$catRow['AvailableBudget'] : 0.00;
    $categoryName = $catRow ? $catRow['ItemCategoryName'] : 'Unknown';
    $stmtCat->close();

    $newBudget = $currentBudget - $totalCost;

    $stmtUpd = $conn->prepare("UPDATE pms_itemcategory SET AvailableBudget = ? WHERE ItemCategoryID = ?");
    $stmtUpd->bind_param("di", $newBudget, $categoryID);
    $stmtUpd->execute();
    $stmtUpd->close();

    // 2. Insert receipt into Budget Logs
    // We save the Qty and UnitCost into Remarks so the Frontend can split them into columns!
    $desc = $itemName; 
    $remarks = "QTY:" . $qty . "|PRICE:" . $unitCost; 
    $priority = "None";
    
    $stmtLog = $conn->prepare("INSERT INTO pms_budget_requests (CategoryID, ItemCategory, Description, TotalAmount, RemainingBudget, Priority, RequestedBy, Remarks, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Purchased')");
    $stmtLog->bind_param("issddsis", $categoryID, $categoryName, $desc, $totalCost, $newBudget, $priority, $userID, $remarks);
    $stmtLog->execute();
    $stmtLog->close();
}
// ==========================================
// === BUDGET REQUEST ACTIONS (DUAL-INSERT) ===
// ==========================================

function getBudgetRequests($conn) {
    // --- AUTO-SYNC WITH FINANCE ---
    $conn->begin_transaction();
    try {
        // A. Sync ACCEPTED requests (ADD MONEY TO BUDGET)
        $stmtFindAcc = $conn->prepare("
            SELECT br.RequestID, br.CategoryID, br.TotalAmount 
            FROM pms_budget_requests br
            JOIN expense_notifications en ON en.external_reference_id = CONCAT('INV-REQ-', br.RequestID)
            WHERE br.Status = 'Pending' AND LOWER(en.status) IN ('accepted', 'approved')
        ");
        $stmtFindAcc->execute();
        $resultAcc = $stmtFindAcc->get_result();
        
        while ($row = $resultAcc->fetch_assoc()) {
            $reqId = $row['RequestID'];
            $catId = $row['CategoryID'];
            $amount = (float)$row['TotalAmount'];
            
            // 1. Get current budget and ADD the new funds
            $stmtCat = $conn->prepare("SELECT AvailableBudget FROM pms_itemcategory WHERE ItemCategoryID = ?");
            $stmtCat->bind_param("i", $catId);
            $stmtCat->execute();
            $currentBudget = $stmtCat->get_result()->fetch_assoc()['AvailableBudget'] ?? 0;
            $stmtCat->close();
            
            $newBudget = $currentBudget + $amount;
            
            // 2. Deposit funds to Category
            $stmtDep = $conn->prepare("UPDATE pms_itemcategory SET AvailableBudget = ? WHERE ItemCategoryID = ?");
            $stmtDep->bind_param("di", $newBudget, $catId);
            $stmtDep->execute();
            $stmtDep->close();
            
            // 3. Mark request as Accepted and record the new balance
            $stmtMarkAcc = $conn->prepare("UPDATE pms_budget_requests SET Status = 'Accepted', RemainingBudget = ? WHERE RequestID = ?");
            $stmtMarkAcc->bind_param("di", $newBudget, $reqId);
            $stmtMarkAcc->execute();
            $stmtMarkAcc->close();
        }
        $stmtFindAcc->close();

        // B. Sync REJECTED requests (No money moved, just update status)
        $stmtSyncRej = $conn->prepare("
            UPDATE pms_budget_requests br
            JOIN expense_notifications en ON en.external_reference_id = CONCAT('INV-REQ-', br.RequestID)
            SET br.Status = 'Rejected'
            WHERE br.Status = 'Pending' AND LOWER(en.status) = 'rejected'
        ");
        $stmtSyncRej->execute();
        $stmtSyncRej->close();
        
        $conn->commit();
    } catch (Exception $e) { $conn->rollback(); }

    // --- FETCH THE UPDATED LIST ---
    $sql = "SELECT br.*, CONCAT(u.Fname, ' ', u.Lname) AS RequestedByName, ic.ItemCategoryName AS CategoryName
            FROM pms_budget_requests br 
            LEFT JOIN pms_users u ON br.RequestedBy = u.UserID 
            LEFT JOIN pms_itemcategory ic ON br.CategoryID = ic.ItemCategoryID
            ORDER BY br.RequestDate DESC";
            
    $result = $conn->query($sql);
    $requests = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) { $requests[] = $row; }
    }
    
    header('Content-Type: application/json');
    echo json_encode($requests);
}

function addBudgetRequest($conn, $data, $userID) {
    $categoryID = (int)($data['category_id'] ?? 0);
    $description = trim($data['description'] ?? '');
    $totalAmount = (float)($data['requested_amount'] ?? 0);
    $priorityUI = trim($data['priority'] ?? 'Low'); 
    $remarks = trim($data['remarks'] ?? '');
    
    if ($categoryID <= 0 || empty($description) || $totalAmount <= 0) throw new Exception("Invalid request details.");
    $dbPriority = strtolower($priorityUI); 

    $conn->begin_transaction();

    // Just get the current balance for the record (NO DEDUCTION)
    $stmtCat = $conn->prepare("SELECT AvailableBudget, ItemCategoryName FROM pms_itemcategory WHERE ItemCategoryID = ?");
    $stmtCat->bind_param("i", $categoryID);
    $stmtCat->execute();
    $catRow = $stmtCat->get_result()->fetch_assoc();
    $currentBudget = $catRow ? (float)$catRow['AvailableBudget'] : 0.00;
    $categoryName = $catRow ? $catRow['ItemCategoryName'] : 'Unknown Category';
    $stmtCat->close();

    // Get User Details
    $stmtUser = $conn->prepare("SELECT Fname, Lname FROM pms_users WHERE UserID = ?");
    $stmtUser->bind_param("i", $userID);
    $stmtUser->execute();
    $userRow = $stmtUser->get_result()->fetch_assoc();
    $requesterName = $userRow ? trim($userRow['Fname'] . ' ' . $userRow['Lname']) : 'InventoryManager';
    $stmtUser->close();

    // Insert into Inventory Budget Requests (Status is 'Pending' by default)
    $stmt1 = $conn->prepare("INSERT INTO pms_budget_requests (CategoryID, ItemCategory, Description, TotalAmount, RemainingBudget, Priority, RequestedBy, Remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt1->bind_param("issddsis", $categoryID, $categoryName, $description, $totalAmount, $currentBudget, $priorityUI, $userID, $remarks);
    $stmt1->execute();
    $requestID = $conn->insert_id;
    $stmt1->close();

    // Push to Finance Notification
    $extRef = "INV-REQ-" . $requestID;
    $notifTitle = "Budget Request: " . $categoryName;
    $stmt2 = $conn->prepare("INSERT INTO expense_notifications (external_reference_id, title, description, requested_amount, requested_by, purpose, priority, status, department_id) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 2)");
    $stmt2->bind_param("sssdsss", $extRef, $notifTitle, $description, $totalAmount, $requesterName, $remarks, $dbPriority);
    $stmt2->execute();
    $stmt2->close();

    $conn->commit();
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => 'Budget requested successfully.']);
}

function deleteBudgetRequest($conn, $data) {
    $requestID = (int)($data['request_id'] ?? 0);
    if ($requestID <= 0) throw new Exception("Invalid request ID.");

    $conn->begin_transaction();

    // Mark as Cancelled (NO REFUND needed because it never deducted)
    $stmtUpdate = $conn->prepare("UPDATE pms_budget_requests SET Status = 'Cancelled' WHERE RequestID = ? AND Status = 'Pending'");
    $stmtUpdate->bind_param("i", $requestID);
    $stmtUpdate->execute();
    if ($stmtUpdate->affected_rows === 0) {
        $conn->rollback();
        throw new Exception("Request cannot be cancelled. It may have already been processed.");
    }
    $stmtUpdate->close();

    // Delete Finance Notification
    $extRef = "INV-REQ-" . $requestID;
    $stmtDelNotif = $conn->prepare("DELETE FROM expense_notifications WHERE external_reference_id = ? AND status = 'pending'");
    $stmtDelNotif->bind_param("s", $extRef);
    $stmtDelNotif->execute();
    $stmtDelNotif->close();

    $conn->commit();
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => 'Request cancelled.']);
}
?>