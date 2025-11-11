<?php
// 1. Start the session with the same secure settings
session_start([
  'cookie_httponly' => true,
  'cookie_secure' => isset($_SERVER['HTTPS']),
  'use_strict_mode' => true
]);

// 2. Load the database connection
require_once('db_connection.php');

// 3. Check if the user is actually logged in.
if (!isset($_SESSION['UserID'])) {
  header('Content-Type: application/json');
  echo json_encode(['error' => 'User not authenticated.']);
  exit();
}

// Get the logged-in UserID
$currentUserID = $_SESSION['UserID'];

// 4. Determine which action to perform
$action = $_GET['action'] ?? '';

// We use a switch statement to route the request to the correct function
try {
  switch ($action) {
    case 'get_inventory':
      getInventory($conn);
      break;
    case 'get_history':
      getInventoryHistory($conn);
      break;
    case 'get_categories':
      getCategories($conn);
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
      deleteItem($conn, $_POST, $currentUserID);
      break;
    default:
      http_response_code(400);
      echo json_encode(['error' => 'Invalid action specified.']);
  }
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}

// 5. Close the database connection
$conn->close();

// ======================================================
// === ACTION FUNCTIONS ===
// ======================================================

/**
 * Fetches the main inventory list for the "Stocks" tab.
 */
function getInventory($conn) {
  // DamageItem has been removed from this query.
  $sql = "SELECT 
            i.ItemID, 
            i.ItemName, 
            ic.ItemCategoryName AS Category,
            i.ItemQuantity, 
            i.ItemDescription, 
            i.ItemStatus, 
            DATE_FORMAT(i.DateofStockIn, '%Y-%m-%d') AS DateofStockIn, 
            ic.ItemCategoryID
          FROM inventory i
          JOIN itemcategory ic ON i.ItemCategoryID = ic.ItemCategoryID
          ORDER BY i.ItemName";
  
  $result = $conn->query($sql);
  if (!$result) {
    throw new Exception("Error fetching inventory: " . $conn->error);
  }
  $items = [];
  while ($row = $result->fetch_assoc()) {
    $items[] = $row;
  }
  header('Content-Type: application/json');
  echo json_encode($items);
}

/**
 * Fetches the inventory log for the "History" tab.
 * DamageItem has been removed from this query.
 */
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
            rt.DateofRelease
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
              FROM inventorylog il
          ) AS rt
          JOIN inventory i ON rt.ItemID = i.ItemID
          JOIN itemcategory ic ON i.ItemCategoryID = ic.ItemCategoryID
          JOIN users u ON rt.UserID = u.UserID
          ORDER BY rt.DateofRelease DESC, rt.InvLogID DESC";

  $result = $conn->query($sql);
  if (!$result) {
    throw new Exception("Error fetching history: " . $conn->error);
  }
  $logs = [];
  while ($row = $result->fetch_assoc()) {
    $logs[] = $row;
  }
  header('Content-Type: application/json');
  echo json_encode($logs);
}

/**
 * Fetches the list of item categories to populate the dropdowns.
 */
function getCategories($conn) {
  $sql = "SELECT ItemCategoryID, ItemCategoryName FROM itemcategory ORDER BY ItemCategoryName";
  $result = $conn->query($sql);
  if (!$result) {
    throw new Exception("Error fetching categories: " . $conn->error);
  }
  $categories = [];
  while ($row = $result->fetch_assoc()) {
    $categories[] = $row;
  }
  header('Content-Type: application/json');
  echo json_encode($categories);
}

/**
 * Adds a new item to the 'inventory' table.
 * DamageItem logic has been removed.
 */
function addItem($conn, $data, $userID) {
  $name = $data['name'];
  $categoryID = (int)$data['category_id'];
  $description = $data['description'];
  $quantity = (int)$data['quantity'];
  $stockInDate = $data['stock_in_date'];

  $status = 'In Stock';
  if ($quantity == 0) {
    $status = 'Out of Stock';
  } elseif ($quantity <= 10) { 
    $status = 'Low Stock';
  }

  $conn->begin_transaction();

  // 1. Insert into 'inventory' table
  // DamageItem column has been removed from the INSERT.
  $stmt = $conn->prepare(
    "INSERT INTO inventory (ItemName, ItemCategoryID, ItemQuantity, ItemDescription, ItemStatus, DateofStockIn) 
     VALUES (?, ?, ?, ?, ?, ?)"
  );
  // Bind types: s(Name), i(CatID), i(Qty), s(Desc), s(Status), s(StockInDate)
  $stmt->bind_param("siisss", $name, $categoryID, $quantity, $description, $status, $stockInDate);
  
  if (!$stmt->execute()) {
    $conn->rollback();
    throw new Exception("Error adding item: " + $stmt->error);
  }

  $newItemID = $conn->insert_id;

  // 2. Insert into 'inventorylog' table
  $logReason = "Initial Stock In";
  $logStmt = $conn->prepare(
    "INSERT INTO inventorylog (UserID, ItemID, Quantity, InventoryLogReason, DateofRelease) 
     VALUES (?, ?, ?, ?, NOW())"
  );
  $logStmt->bind_param("iiis", $userID, $newItemID, $quantity, $logReason);

  if (!$logStmt->execute()) {
    $conn->rollback();
    throw new Exception("Error logging item creation: " + $logStmt->error);
  }

  $conn->commit();
  header('Content-Type: application/json');
  echo json_encode(['success' => true, 'message' => 'Item added successfully.', 'new_item_id' => $newItemID]);
}

/**
 * Updates an existing item in the 'inventory' table.
 * Only allows positive stock adjustments.
 */
function updateItem($conn, $data, $userID) {
  $itemID = (int)$data['item_id'];
  $name = $data['name'];
  $categoryID = (int)$data['category_id'];
  $description = $data['description'];
  $stockAdjustment = (int)$data['stock_adjustment'];

  // Enforce only positive stock adjustments
  if ($stockAdjustment < 0) {
      $stockAdjustment = 0;
  }

  $conn->begin_transaction();

  // 1. Get the current quantity
  $currentQuantity = 0;
  $qtyStmt = $conn->prepare("SELECT ItemQuantity FROM inventory WHERE ItemID = ?");
  $qtyStmt->bind_param("i", $itemID);
  
  if ($qtyStmt->execute()) {
    $result = $qtyStmt->get_result();
    if ($row = $result->fetch_assoc()) {
      $currentQuantity = (int)$row['ItemQuantity'];
    }
  } else {
    $conn->rollback();
    throw new Exception("Error fetching current item state: " . $qtyStmt->error);
  }
  $qtyStmt->close();

  // 2. Calculate new quantity and status
  $newQuantity = $currentQuantity + $stockAdjustment;
  $status = 'In Stock';

  if ($newQuantity <= 0) {
    $status = 'Out of Stock';
    $newQuantity = 0; 
  } else if ($newQuantity <= 10) {
    $status = 'Low Stock';
  }

  // 3. Update the 'inventory' table
  $stmt = $conn->prepare(
    "UPDATE inventory 
     SET ItemName = ?, ItemCategoryID = ?, ItemDescription = ?, 
         ItemQuantity = ?, ItemStatus = ?
     WHERE ItemID = ?"
  );
  // Bind types: s(Name), i(CatID), s(Desc), i(Qty), s(Status), i(ItemID)
  $stmt->bind_param("sisisi", $name, $categoryID, $description, $newQuantity, $status, $itemID);
  
  if (!$stmt->execute()) {
    $conn->rollback();
    throw new Exception("Error updating item: " + $stmt->error);
  }

  // 4. If stock was changed, log it
  if ($stockAdjustment != 0) {
    $logReason = "Stock Added";
    
    $logStmt = $conn->prepare(
      "INSERT INTO inventorylog (UserID, ItemID, Quantity, InventoryLogReason, DateofRelease) 
       VALUES (?, ?, ?, ?, NOW())"
    );
    $logStmt->bind_param("iiis", $userID, $itemID, $stockAdjustment, $logReason);

    if (!$logStmt->execute()) {
      $conn->rollback();
      throw new Exception("Error logging stock adjustment: " + $logStmt->error);
    }
  }

  $conn->commit();
  header('Content-Type: application/json');
  echo json_encode(['success' => true, 'message' => 'Item updated successfully.']);
}

/**
 * Deletes an item from the 'inventory' table.
 */
function deleteItem($conn, $data, $userID) {
  $itemID = (int)$data['item_id'];

  $conn->begin_transaction();

  // 1. Delete from 'inventorylog'
  $logStmt = $conn->prepare("DELETE FROM inventorylog WHERE ItemID = ?");
  $logStmt->bind_param("i", $itemID);
  if (!$logStmt->execute()) {
    $conn->rollback();
    throw new Exception("Error deleting item logs: " . $logStmt->error);
  }

  // 2. Delete from 'inventory'
  $stmt = $conn->prepare("DELETE FROM inventory WHERE ItemID = ?");
  $stmt->bind_param("i", $itemID);
  if (!$stmt->execute()) {
    $conn->rollback();
    throw new Exception("Error deleting item: " . $stmt->error);
  }

  $conn->commit();
  header('Content-Type: application/json');
  echo json_encode(['success' => true, 'message' => 'Item and all associated logs have been deleted.']);
}


function issueItem($conn, $data, $userID) {
  $itemID = (int)$data['item_id'];
  // The stock adjustment from JS is already negative (e.g., -5)
  $stockAdjustment = (int)$data['stock_adjustment'];
  $logReason = $data['log_reason'] ?? 'Item Issued'; // Get reason from JS

  // Security check: ensure stock adjustment is negative
  if ($stockAdjustment >= 0) {
    throw new Exception("Issue action requires a negative stock adjustment.");
  }

  $conn->begin_transaction();

  // 1. Get the current quantity
  $currentQuantity = 0;
  $qtyStmt = $conn->prepare("SELECT ItemQuantity FROM inventory WHERE ItemID = ?");
  $qtyStmt->bind_param("i", $itemID);

  if ($qtyStmt->execute()) {
    $result = $qtyStmt->get_result();
    if ($row = $result->fetch_assoc()) {
      $currentQuantity = (int)$row['ItemQuantity'];
    } else {
       $conn->rollback();
       throw new Exception("Item with ID $itemID not found.");
    }
  } else {
    $conn->rollback();
    throw new Exception("Error fetching current item state: " . $qtyStmt->error);
  }
  $qtyStmt->close();

  // 2. Calculate new quantity and status
  $newQuantity = $currentQuantity + $stockAdjustment; // e.g., 100 + (-5) = 95
  $status = 'In Stock';

  if ($newQuantity < $currentQuantity && $newQuantity <= 0) {
    $status = 'Out of Stock';
    $newQuantity = 0; // Don't allow negative inventory
  } else if ($newQuantity <= 10) { // Assuming 10 is the 'low stock' threshold
    $status = 'Low Stock';
  }

  // 3. Update the 'inventory' table (quantity and status only)
  $stmt = $conn->prepare(
    "UPDATE inventory 
     SET ItemQuantity = ?, ItemStatus = ?
     WHERE ItemID = ?"
  );
  // Bind types: i(Qty), s(Status), i(ItemID)
  $stmt->bind_param("isi", $newQuantity, $status, $itemID);

  if (!$stmt->execute()) {
    $conn->rollback();
    throw new Exception("Error updating item quantity: " . $stmt->error);
  }

  // 4. Log the change
  $logStmt = $conn->prepare(
    "INSERT INTO inventorylog (UserID, ItemID, Quantity, InventoryLogReason, DateofRelease) 
     VALUES (?, ?, ?, ?, NOW())"
  );
  // We log the negative adjustment (e.g., -5)
  $logStmt->bind_param("iiis", $userID, $itemID, $stockAdjustment, $logReason);

  if (!$logStmt->execute()) {
    $conn->rollback();
    throw new Exception("Error logging stock issue: " . $logStmt->error);
  }

  $conn->commit();
  header('Content-Type: application/json');
  echo json_encode(['success' => true, 'message' => 'Item issued successfully.']);
}
?>