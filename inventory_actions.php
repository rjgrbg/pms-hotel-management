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
            ic.ItemCategoryName AS Category,
            i.ItemQuantity, 
            i.LowStockThreshold,
            i.ItemDescription, 
            i.ItemStatus, 
            DATE_FORMAT(i.DateofStockIn, '%Y-%m-%d') AS DateofStockIn, 
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
                      ORDER BY il.DateofRelease, il.InvLogID
                  ) AS NewQuantity
              FROM pms_inventorylog il
          ) AS rt
          JOIN pms_inventory i ON rt.ItemID = i.ItemID
          JOIN pms_itemcategory ic ON i.ItemCategoryID = ic.ItemCategoryID
          JOIN pms_users u ON rt.UserID = u.UserID
          ORDER BY rt.DateofRelease DESC, rt.InvLogID DESC";

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
  // *** REMOVED htmlspecialchars, KEPT trim ***
  $name = trim($data['name'] ?? '');
  $description = trim($data['description'] ?? '');
  $stockInDate = trim($data['stock_in_date'] ?? '');
  $categoryID = (int)($data['category_id'] ?? 0); 
  $quantity = (int)($data['quantity'] ?? 0);
  $threshold = (int)($data['low_stock_threshold'] ?? 10);

  if (empty($name)) throw new Exception("Item name is required.");
  if ($categoryID <= 0) throw new Exception("Invalid category selected.");
  if (empty($stockInDate)) throw new Exception("Stock in date is required.");
  if ($threshold < 0) throw new Exception("Threshold cannot be negative.");

  $status = 'In Stock';
  if ($quantity == 0) {
    $status = 'Out of Stock';
  } elseif ($quantity <= $threshold) { 
    $status = 'Low Stock';
  }

  $conn->begin_transaction();

  $stmt = $conn->prepare(
    "INSERT INTO pms_inventory (ItemName, ItemCategoryID, ItemQuantity, ItemDescription, ItemStatus, DateofStockIn, LowStockThreshold) 
     VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  $stmt->bind_param("siisssi", $name, $categoryID, $quantity, $description, $status, $stockInDate, $threshold);
  
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
  // *** REMOVED htmlspecialchars, KEPT trim ***
  $name = trim($data['name'] ?? '');
  $description = trim($data['description'] ?? '');
  $categoryID = (int)($data['category_id'] ?? 0);
  $stockAdjustment = (int)($data['stock_adjustment'] ?? 0);
  $threshold = (int)($data['low_stock_threshold'] ?? 10);

  if (empty($name)) throw new Exception("Item name is required.");
  if ($categoryID <= 0) throw new Exception("Invalid category selected.");
  if ($itemID <= 0) throw new Exception("Invalid item ID.");
  if ($threshold < 0) throw new Exception("Threshold cannot be negative.");
  
  if ($stockAdjustment < 0) $stockAdjustment = 0;

  $conn->begin_transaction();

  $currentQuantity = 0;
  $qtyStmt = $conn->prepare("SELECT ItemQuantity FROM pms_inventory WHERE ItemID = ?");
  $qtyStmt->bind_param("i", $itemID);
  
  if ($qtyStmt->execute()) {
    $result = $qtyStmt->get_result();
    if ($row = $result->fetch_assoc()) {
      $currentQuantity = (int)$row['ItemQuantity'];
    } else {
        $conn->rollback();
        throw new Exception("Item not found.");
    }
  } else {
    $conn->rollback();
    throw new Exception("Error fetching current item state: ". $qtyStmt->error);
  }
  $qtyStmt->close();

  $newQuantity = $currentQuantity + $stockAdjustment;
  $status = 'In Stock';

  if ($newQuantity <= 0) {
    $status = 'Out of Stock';
    $newQuantity = 0; 
  } else if ($newQuantity <= $threshold) {
    $status = 'Low Stock';
  }

  $stmt = $conn->prepare(
    "UPDATE pms_inventory 
     SET ItemName = ?, ItemCategoryID = ?, ItemDescription = ?, 
         ItemQuantity = ?, ItemStatus = ?, LowStockThreshold = ?
     WHERE ItemID = ?"
  );
  $stmt->bind_param("sisisii", $name, $categoryID, $description, $newQuantity, $status, $threshold, $itemID);
  
  if (!$stmt->execute()) {
    $conn->rollback();
    throw new Exception("Error updating item: ". $stmt->error);
  }

  if ($stockAdjustment != 0) {
    $logReason = "Stock Added";
    $logStmt = $conn->prepare(
      "INSERT INTO pms_inventorylog (UserID, ItemID, Quantity, InventoryLogReason, DateofRelease) 
       VALUES (?, ?, ?, ?, NOW())"
    );
    $logStmt->bind_param("iiis", $userID, $itemID, $stockAdjustment, $logReason);

    if (!$logStmt->execute()) {
      $conn->rollback();
      throw new Exception("Error logging stock adjustment: ". $logStmt->error);
    }
  }

  $conn->commit();
  header('Content-Type: application/json');
  echo json_encode(['success' => true, 'message' => 'Item updated successfully.']);
}

function issueItem($conn, $data, $userID) {
  $itemID = (int)($data['item_id'] ?? 0);
  $stockAdjustment = (int)($data['stock_adjustment'] ?? 0);
  
  // *** REMOVED htmlspecialchars, KEPT trim ***
  $logReason = trim($data['log_reason'] ?? 'Item Issued');
  
  if (empty($logReason)) $logReason = 'Item Issued';
  if ($stockAdjustment >= 0) throw new Exception("Issue action requires a negative stock adjustment.");
  if ($itemID <= 0) throw new Exception("Invalid item ID.");

  $conn->begin_transaction();

  $currentQuantity = 0;
  $threshold = 10;

  $qtyStmt = $conn->prepare("SELECT ItemQuantity, LowStockThreshold FROM pms_inventory WHERE ItemID = ?");
  $qtyStmt->bind_param("i", $itemID);

  if ($qtyStmt->execute()) {
    $result = $qtyStmt->get_result();
    if ($row = $result->fetch_assoc()) {
      $currentQuantity = (int)$row['ItemQuantity'];
      $threshold = (int)$row['LowStockThreshold'];
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

  if ($newQuantity <= 0) {
    $status = 'Out of Stock';
  } else if ($newQuantity <= $threshold) { 
    $status = 'Low Stock';
  }

  $stmt = $conn->prepare("UPDATE pms_inventory SET ItemQuantity = ?, ItemStatus = ? WHERE ItemID = ?");
  $stmt->bind_param("isi", $newQuantity, $status, $itemID);

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
?>