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
// We expect an 'action' parameter (e.g., ?action=get_inventory)
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
      // Data from 'add_item_form' will be sent via POST
      addItem($conn, $_POST, $currentUserID);
      break;
    case 'update_item':
      // Data from 'edit-item-form' will be sent via POST
      updateItem($conn, $_POST, $currentUserID);
      break;
    case 'delete_item':
      // The ItemID will be sent via POST
      deleteItem($conn, $_POST, $currentUserID);
      break;
    default:
      // Set 400 Bad Request status code
      http_response_code(400);
      echo json_encode(['error' => 'Invalid action specified.']);
  }
} catch (Exception $e) {
  // Set 500 Internal Server Error status code
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
 * Joins with 'itemcategory' to get the category name.
 */
function getInventory($conn) {
  $sql = "SELECT 
            i.ItemID, 
            i.ItemName, 
            ic.ItemCategoryName AS Category,
            i.ItemQuantity, 
            i.ItemDescription, 
            i.ItemStatus, 
            i.DamageItem, 
            DATE_FORMAT(i.DateofStockIn, '%Y-%m-%d') AS DateofStockIn, 
            DATE_FORMAT(i.DateofStockOut, '%Y-%m-%d') AS DateofStockOut,
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
 * Joins with 'inventory', 'itemcategory', and 'users' to get full details.
 */
function getInventoryHistory($conn) {
  $sql = "SELECT 
            il.InvLogID,
            i.ItemName,
            ic.ItemCategoryName AS Category,
            i.ItemQuantity,
            il.Quantity AS QuantityChange,
            i.ItemStatus,
            i.DamageItem,
            DATE_FORMAT(i.DateofStockIn, '%Y-%m-%d') AS DateofStockIn,
            DATE_FORMAT(i.DateofStockOut, '%Y-%m-%d') AS DateofStockOut,
            il.InventoryLogReason AS ActionType,
            CONCAT(u.Fname, ' ', u.Lname) AS PerformedBy,
            il.DateofRelease
          FROM inventorylog il
          JOIN inventory i ON il.ItemID = i.ItemID
          JOIN itemcategory ic ON i.ItemCategoryID = ic.ItemCategoryID
          JOIN users u ON il.UserID = u.UserID
          ORDER BY il.DateofRelease DESC";

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
 * Adds a new item to the 'inventory' table and creates an initial log
 * in the 'inventorylog' table.
 */
function addItem($conn, $data, $userID) {
  // Extract and sanitize data from the POST request
  $name = $data['name'];
  $categoryID = (int)$data['category_id'];
  $description = $data['description'];
  $quantity = (int)$data['quantity'];
  $stockInDate = $data['stock_in_date'];

  // === User is in control of status, so we auto-calculate it ===
  $status = 'In Stock';
  if ($quantity == 0) {
    $status = 'Out of Stock';
  } elseif ($quantity <= 10) { // Assuming 10 is the 'low stock' threshold
    $status = 'Low Stock';
  }

  // Use a transaction to ensure both inserts succeed or fail together
  $conn->begin_transaction();

  // 1. Insert into 'inventory' table
  $stmt = $conn->prepare(
    "INSERT INTO inventory (ItemName, ItemCategoryID, ItemQuantity, ItemDescription, ItemStatus, DateofStockIn, DamageItem) 
     VALUES (?, ?, ?, ?, ?, ?, 0)"
  );
  $stmt->bind_param("sisiss", $name, $categoryID, $quantity, $description, $status, $stockInDate);
  
  if (!$stmt->execute()) {
    $conn->rollback();
    throw new Exception("Error adding item: " . $stmt->error);
  }

  // Get the ID of the item we just inserted
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
    throw new Exception("Error logging item creation: " . $logStmt->error);
  }

  // If both queries were successful, commit the transaction
  $conn->commit();
  header('Content-Type: application/json');
  echo json_encode(['success' => true, 'message' => 'Item added successfully.', 'new_item_id' => $newItemID]);
}

/**
 * Updates an existing item in the 'inventory' table.
 * If the stock level is changed, it creates a new log entry.
 */
function updateItem($conn, $data, $userID) {
  // Extract and sanitize data
  $itemID = (int)$data['item_id'];
  $name = $data['name'];
  $categoryID = (int)$data['category_id'];
  $description = $data['description'];
  $stockAdjustment = (int)$data['stock_adjustment'];
  // === User is in control of status, so we take it from the form ===
  $status = $data['status'];

  // Use a transaction
  $conn->begin_transaction();

  // 1. Update the 'inventory' table
  $stmt = $conn->prepare(
    "UPDATE inventory 
     SET ItemName = ?, ItemCategoryID = ?, ItemDescription = ?, ItemQuantity = ItemQuantity + ?, ItemStatus = ?
     WHERE ItemID = ?"
  );
  $stmt->bind_param("sisisi", $name, $categoryID, $description, $stockAdjustment, $status, $itemID);
  
  if (!$stmt->execute()) {
    $conn->rollback();
    throw new Exception("Error updating item: " . $stmt->error);
  }

  // 2. If stock was changed, log it
  if ($stockAdjustment != 0) {
    $logReason = $stockAdjustment > 0 ? "Stock Added" : "Stock Removed";
    
    $logStmt = $conn->prepare(
      "INSERT INTO inventorylog (UserID, ItemID, Quantity, InventoryLogReason, DateofRelease) 
       VALUES (?, ?, ?, ?, NOW())"
    );
    $logStmt->bind_param("iiis", $userID, $itemID, $stockAdjustment, $logReason);

    if (!$logStmt->execute()) {
      $conn->rollback();
      throw new Exception("Error logging stock adjustment: " . $logStmt->error);
    }
  }

  // Commit the transaction
  $conn->commit();
  header('Content-Type: application/json');
  echo json_encode(['success' => true, 'message' => 'Item updated successfully.']);
}

/**
 * Deletes an item from the 'inventory' table.
 * WARNING: This will also delete all associated logs due to the database schema.
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

  // Commit the transaction
  $conn->commit();
  header('Content-Type: application/json');
  echo json_encode(['success' => true, 'message' => 'Item and all associated logs have been deleted.']);
}

?>