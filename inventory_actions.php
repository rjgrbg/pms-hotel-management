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
    
    // === ACTIONS FOR CATEGORY MANAGEMENT ===
    case 'add_category':
      addCategory($conn, $_POST);
      break;
    case 'update_category':
      updateCategory($conn, $_POST);
      break;
    case 'delete_category':
      deleteCategory($conn, $_POST);
      break;
    // === END OF NEW ACTIONS ===
    
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
          FROM pms_inventory i
          JOIN pms_itemcategory ic ON i.ItemCategoryID = ic.ItemCategoryID
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
              FROM pms_inventorylog il
          ) AS rt
          JOIN pms_inventory i ON rt.ItemID = i.ItemID
          JOIN pms_itemcategory ic ON i.ItemCategoryID = ic.ItemCategoryID
          JOIN pms_users u ON rt.UserID = u.UserID
          ORDER BY rt.DateofRelease DESC, rt.InvLogID DESC";

  $result = $conn->query($sql);
  if (!$result) {
    throw new Exception("Error fetching history: ". $conn->error);
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
  $sql = "SELECT ItemCategoryID, ItemCategoryName FROM pms_itemcategory ORDER BY ItemCategoryName";
  $result = $conn->query($sql);
  if (!$result) {
    throw new Exception("Error fetching categories: ". $conn->error);
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
  // === SANITIZE AND STRIP INPUTS ===
  $name = htmlspecialchars(trim($data['name'] ?? ''), ENT_QUOTES, 'UTF-8');
  $description = htmlspecialchars(trim($data['description'] ?? ''), ENT_QUOTES, 'UTF-8');
  $stockInDate = trim($data['stock_in_date'] ?? '');
  $categoryID = (int)($data['category_id'] ?? 0); 
  $quantity = (int)($data['quantity'] ?? 0);

  // === VALIDATE INPUTS ===
  if (empty($name)) {
      throw new Exception("Item name is required.");
  }
  if ($categoryID <= 0) {
      throw new Exception("Invalid category selected.");
  }
  if (empty($stockInDate)) {
       throw new Exception("Stock in date is required.");
  }
  // === END VALIDATION ===

  $status = 'In Stock';
  if ($quantity == 0) {
    $status = 'Out of Stock';
  } elseif ($quantity <= 10) { 
    $status = 'Low Stock';
  }

  $conn->begin_transaction();

  // 1. Insert into 'inventory' table
  $stmt = $conn->prepare(
    "INSERT INTO pms_inventory (ItemName, ItemCategoryID, ItemQuantity, ItemDescription, ItemStatus, DateofStockIn) 
     VALUES (?, ?, ?, ?, ?, ?)"
  );
  $stmt->bind_param("siisss", $name, $categoryID, $quantity, $description, $status, $stockInDate);
  
  if (!$stmt->execute()) {
    $conn->rollback();
    throw new Exception("Error adding item: ". $stmt->error);
  }

  $newItemID = $conn->insert_id;

  // 2. Insert into 'inventorylog' table
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

/**
 * Updates an existing item in the 'inventory' table.
 * Only allows positive stock adjustments.
 */
function updateItem($conn, $data, $userID) {
  $itemID = (int)($data['item_id'] ?? 0);
  
  // === SANITIZE AND STRIP INPUTS ===
  $name = htmlspecialchars(trim($data['name'] ?? ''), ENT_QUOTES, 'UTF-8');
  $description = htmlspecialchars(trim($data['description'] ?? ''), ENT_QUOTES, 'UTF-8');
  $categoryID = (int)($data['category_id'] ?? 0);
  $stockAdjustment = (int)($data['stock_adjustment'] ?? 0);

  // === VALIDATE INPUTS ===
  if (empty($name)) {
      throw new Exception("Item name is required.");
  }
  if ($categoryID <= 0) {
      throw new Exception("Invalid category selected.");
  }
  if ($itemID <= 0) {
      throw new Exception("Invalid item ID.");
  }
  // === END VALIDATION ===
  
  // Enforce only positive stock adjustments
  if ($stockAdjustment < 0) {
      $stockAdjustment = 0;
  }

  $conn->begin_transaction();

  // 1. Get the current quantity
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
    "UPDATE pms_inventory 
     SET ItemName = ?, ItemCategoryID = ?, ItemDescription = ?, 
         ItemQuantity = ?, ItemStatus = ?
     WHERE ItemID = ?"
  );
  $stmt->bind_param("sisisi", $name, $categoryID, $description, $newQuantity, $status, $itemID);
  
  if (!$stmt->execute()) {
    $conn->rollback();
    throw new Exception("Error updating item: ". $stmt->error);
  }

  // 4. If stock was changed, log it
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

/**
 * Deletes an item from the 'inventory' table.
 */
function deleteItem($conn, $data, $userID) {
  $itemID = (int)$data['item_id'];

  if ($itemID <= 0) {
      throw new Exception("Invalid item ID.");
  }

  $conn->begin_transaction();

  // 1. Delete from 'inventorylog'
  $logStmt = $conn->prepare("DELETE FROM pms_inventorylog WHERE ItemID = ?");
  $logStmt->bind_param("i", $itemID);
  if (!$logStmt->execute()) {
    $conn->rollback();
    throw new Exception("Error deleting item logs: ". $logStmt->error);
  }

  // 2. Delete from 'inventory'
  $stmt = $conn->prepare("DELETE FROM pms_inventory WHERE ItemID = ?");
  $stmt->bind_param("i", $itemID);
  if (!$stmt->execute()) {
    $conn->rollback();
    throw new Exception("Error deleting item: ". $stmt->error);
  }

  $conn->commit();
  header('Content-Type: application/json');
  echo json_encode(['success' => true, 'message' => 'Item and all associated logs have been deleted.']);
}


function issueItem($conn, $data, $userID) {
  $itemID = (int)($data['item_id'] ?? 0);
  $stockAdjustment = (int)($data['stock_adjustment'] ?? 0);
  
  // === SANITIZE AND STRIP INPUT ===
  $logReason = htmlspecialchars(trim($data['log_reason'] ?? 'Item Issued'), ENT_QUOTES, 'UTF-8');
  
  // Set default if it was just whitespace
  if (empty($logReason)) {
      $logReason = 'Item Issued';
  }

  // Security check: ensure stock adjustment is negative
  if ($stockAdjustment >= 0) {
    throw new Exception("Issue action requires a negative stock adjustment.");
  }
  
  if ($itemID <= 0) {
      throw new Exception("Invalid item ID.");
  }

  $conn->begin_transaction();

  // 1. Get the current quantity
  $currentQuantity = 0;
  $qtyStmt = $conn->prepare("SELECT ItemQuantity FROM pms_inventory WHERE ItemID = ?");
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
    throw new Exception("Error fetching current item state: ". $qtyStmt->error);
  }
  $qtyStmt->close();
  
  // Check if there is enough stock to issue
  if ($currentQuantity < abs($stockAdjustment)) {
      $conn->rollback();
      throw new Exception("Not enough stock. Only $currentQuantity item(s) available.");
  }

  // 2. Calculate new quantity and status
  $newQuantity = $currentQuantity + $stockAdjustment; // e.g., 100 + (-5) = 95
  $status = 'In Stock';

  if ($newQuantity <= 0) {
    $status = 'Out of Stock';
  } else if ($newQuantity <= 10) { // Assuming 10 is the 'low stock' threshold
    $status = 'Low Stock';
  }

  // 3. Update the 'inventory' table (quantity and status only)
  $stmt = $conn->prepare(
    "UPDATE pms_inventory 
     SET ItemQuantity = ?, ItemStatus = ?
     WHERE ItemID = ?"
  );
  $stmt->bind_param("isi", $newQuantity, $status, $itemID);

  if (!$stmt->execute()) {
    $conn->rollback();
    throw new Exception("Error updating item quantity: ". $stmt->error);
  }

  // 4. Log the change
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


// ======================================================
// === NEW CATEGORY MANAGEMENT FUNCTIONS (SANITIZED) ===
// ======================================================

/**
 * Adds a new category to the 'pms_itemcategory' table.
 */
function addCategory($conn, $data) {
    header('Content-Type: application/json');
    
    // === SANITIZE AND STRIP INPUT ===
    $name = htmlspecialchars(trim($data['CategoryName'] ?? ''), ENT_QUOTES, 'UTF-8');

    if (empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Category name cannot be empty.']);
        return;
    }

    // Check for duplicates
    $checkStmt = $conn->prepare("SELECT 1 FROM pms_itemcategory WHERE ItemCategoryName = ?");
    $checkStmt->bind_param("s", $name);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    if ($result->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'This category already exists.']);
        return;
    }
    $checkStmt->close();

    // Insert new category
    $stmt = $conn->prepare("INSERT INTO pms_itemcategory (ItemCategoryName) VALUES (?)");
    $stmt->bind_param("s", $name);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Category added successfully.']);
    } else {
        throw new Exception("Error adding category: ". $stmt->error);
    }
    $stmt->close();
}

/**
 * Updates an existing category name in the 'pms_itemcategory' table.
 */
function updateCategory($conn, $data) {
    header('Content-Type: application/json');
    
    // === SANITIZE AND STRIP INPUTS ===
    $id = (int)($data['CategoryID'] ?? 0);
    $name = htmlspecialchars(trim($data['CategoryName'] ?? ''), ENT_QUOTES, 'UTF-8');

    if ($id <= 0 || empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Both Category ID and Name are required.']);
        return;
    }

    // Check for duplicates (excluding itself)
    $checkStmt = $conn->prepare("SELECT 1 FROM pms_itemcategory WHERE ItemCategoryName = ? AND ItemCategoryID != ?");
    $checkStmt->bind_param("si", $name, $id);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    if ($result->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'This category name is already in use.']);
        return;
    }
    $checkStmt->close();

    // Update the category
    $stmt = $conn->prepare("UPDATE pms_itemcategory SET ItemCategoryName = ? WHERE ItemCategoryID = ?");
    $stmt->bind_param("si", $name, $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Category updated.']);
    } else {
        throw new Exception("Error updating category: ". $stmt->error);
    }
    $stmt->close();
}

/**
 * Deletes a category from the 'pms_itemcategory' table.
 */
function deleteCategory($conn, $data) {
    header('Content-Type: application/json');
    
    $id = (int)($data['CategoryID'] ?? 0);
    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Category ID is required.']);
        return;
    }

    // 1. Check if any inventory items use this category
    $checkStmt = $conn->prepare("SELECT 1 FROM pms_inventory WHERE ItemCategoryID = ? LIMIT 1");
    $checkStmt->bind_param("i", $id);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows > 0) {
        // Can't delete. Send a user-friendly error.
        echo json_encode(['success' => false, 'message' => 'Cannot delete category. It is currently being used by inventory items.']);
        return;
    }
    $checkStmt->close();

    // 2. No items use it, so proceed with deletion
    $stmt = $conn->prepare("DELETE FROM pms_itemcategory WHERE ItemCategoryID = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Category deleted successfully.']);
    } else {
        throw new Exception("Error deleting category: ". $stmt->error);
    }
    $stmt->close();
}
?>