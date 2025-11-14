<?php
// Include the session check and login requirement logic
include('check_session.php');

// Only allow users with the 'admin' AccountType
require_login(['inventory_manager']);

// --- Fetch User Data from Database ---
include('db_connection.php'); // Ensure DB connection is included
header('Cache-Control: no-cache, no-store, must-revalidate'); 
header('Pragma: no-cache');
header('Expires: 0');
$formattedName = 'InventoryManager'; // Default name
$Accounttype = 'inventory_manager'; // Default type
$Fname = ''; // Initialize Fname
$Mname = ''; // Initialize Mname
$Lname = ''; // Initialize Lname

if (isset($_SESSION['UserID'])) {
    $userId = $_SESSION['UserID'];
    $sql = "SELECT Fname, Mname, Lname, AccountType FROM pms_users WHERE UserID = ?"; 
    
    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("i", $userId);
        if ($stmt->execute()) {
            $result = $stmt->get_result();
            if ($user = $result->fetch_assoc()) {
                // Fetch names and sanitize for display
                $Lname = htmlspecialchars($user['Lname'] ?? 'InventoryManager');
                $Fname = htmlspecialchars($user['Fname'] ?? '');
                $Mname = htmlspecialchars($user['Mname'] ?? '');
                $Accounttype = htmlspecialchars($user['AccountType'] ?? 'inventory_manager'); // Fetch AccountType as well

                // Format the name: Fname M. Lname
                $formattedName = $Fname; // Start with Fname
                if (!empty($Mname)) {
                    $formattedName .= ' ' . strtoupper(substr($Mname, 0, 1)) . '.'; // Add M.
                }
                if (!empty($Lname)) {
                     if(!empty(trim($formattedName))) { // Add space only if Fname or Mname was present
                        $formattedName .= ' ' . $Lname; // Add Lname
                     } else {
                        $formattedName = $Lname; // Only Lname is available
                     }
                }
                
                if (empty(trim($formattedName))) {
                    $formattedName = 'InventoryManager'; // Fallback to default
                }
            } else {
                 error_log("No user found with UserID: " . $userId);
            }
        } else {
            error_log("Error executing user query: " . $stmt->error);
        }
        $stmt->close();
    } else {
         error_log("Error preparing user query: " . $conn->error);
    }
    $conn->close(); // Close connection after fetching
} else {
     error_log("UserID not found in session for admin.php");
}
// --- End Fetch User Data ---

?>
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Celestia Hotel - Inventory Management</title>
  
  <link rel="stylesheet" href="css/inventory.css?v=1.4">
  
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js"></script>

</head>

<body>
  <header class="header">
    <div class="headerLeft">
      <img src="assets/images/celestia-logo.png" alt="Logo" class="headerLogo" />
      <span class="hotelName">THE CELESTIA HOTEL</span>
    </div>

    <img src="assets/icons/profile-icon.png" alt="Profile" class="profileIcon" id="profileBtn" />

<aside class="profile-sidebar" id="profile-sidebar">
    <button class="sidebar-close-btn" id="sidebar-close-btn">&times;</button>
    
    <div class="profile-header">
        <div class="profile-pic-container">
            <i class="fas fa-user-tie"></i>
        </div>
        <h3><?php echo $formattedName; ?></h3>
        <p><?php echo $Accounttype; ?></p>
    </div>

    <nav class="profile-nav">
        <a href="#" id="account-details-link">
            <i class="fas fa-user-edit" style="margin-right: 10px;"></i> Account Details
        </a>
    </nav>
    
    <div class="profile-footer">
        <a id="logoutBtn">
            <i class="fas fa-sign-out-alt" style="margin-right: 10px;"></i> Logout
        </a>
    </div>
</aside>

</header> 

  <div class="modalBackdrop" id="logoutModal" style="display: none;">
    <div class="logoutModal">
      <button class="closeBtn" id="closeLogoutBtn">×</button>
      <div class="modalIcon">
        <img src="assets/icons/logout.png" alt="Logout" class="logoutIcon" />
      </div>
      <h2>Are you sure you want to logout?</h2>
      <p>You will be logged out from your account and redirected to the login page.</p>
      <div class="modalButtons">
        <button class="modalBtn cancelBtn" id="cancelLogoutBtn">CANCEL</button>
        <button class="modalBtn confirmBtn" id="confirmLogoutBtn">YES, LOGOUT</button>
      </div>
    </div>
  </div>
  <div class="mainContainer">
    <h1 class="pageTitle">Inventory</h1>

    <div class="tabNavigation">
      <button class="tabBtn active" data-tab="requests">
        <img src="assets/icons/inventory-log.png" alt="Requests" class="tabIcon" />
        Stocks
      </button>
      <button class="tabBtn" data-tab="history">
        <img src="assets/icons/history-icon.png" alt="History" class="tabIcon" />
        History
      </button>
    </div>

    <div class="tabContent active" id="requests-tab">
      <div class="controlsRow">
        <div class="filterControls">
          <select class="filterDropdown" id="floorFilter">
            <option value="">Category</option>
            <option value="Electrical">Electrical</option>
            <option value="Cleaning Solution">Cleaning Solution</option>
            <option value="Furniture & Fixtures">Furniture & Fixtures</option>
            <option value="Room Amenities">Room Amenities</option>
          </select>

          <select class="filterDropdown" id="roomFilter">
            <option value="">Status</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="In Stock">In Stock</option>
          </select>

          <div class="searchBox">
            <input type="text" placeholder="Search" class="searchInput" id="searchInput" />
            <button class="searchBtn">
              <img src="assets/icons/search-icon.png" alt="Search" />
            </button>
          </div>

          <button class="refreshBtn" id="refreshBtn">
            <img src="assets/icons/refresh-icon.png" alt="Refresh" />
          </button>

          <button class="downloadBtn" id="downloadBtnRequests">
            <img src="assets/icons/download-icon.png" alt="Download" />
          </button>
        </div>
      </div>
      <div class="tableWrapper">
        <table class="requestsTable">
          <thead>
                      <tr>
                          <th class="sortable" data-sort="ItemID">ID</th>
                          <th class="sortable" data-sort="ItemName">Name</th>
                          <th class="sortable" data-sort="Category">Category</th>
                          <th class="sortable" data-sort="ItemQuantity">Quantity</th>
                          <th class="sortable" data-sort="ItemDescription">Description</th>
                          <th class="sortable" data-sort="ItemStatus">Status</th>
                          <th class="sortable" data-sort="DateofStockIn">Stock In Date</th>
                          <th>Action</th> 
                      </tr>
          </thead>
          <tbody id="requestsTableBody">
            <tr><td colspan="8" style="text-align: center;">Loading...</td></tr>
          </tbody>
        </table>
      </div>
      <div class="pagination" id="pagination-stocks"></div>
    </div>


    <div class="tabContent" id="history-tab">
      <div class="controlsRow">
        <div class="filterControls">
          <select class="filterDropdown" id="floorFilterHistory">
            <option value="">Category</option>
            <option value="Electrical">Electrical</option>
            <option value="Cleaning Solution">Cleaning Solution</option>
            <option value="Furniture & Fixtures">Furniture & Fixtures</option>
            <option value="Room Amenities">Room Amenities</option>
          </select>

          <select class="filterDropdown" id="roomFilterHistory">
            <option value="">Status</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="In Stock">In Stock</option>
          </select>

          <div class="searchBox">
            <input type="text" placeholder="Search" class="searchInput" id="historySearchInput" />
            <button class="searchBtn">
              <img src="assets/icons/search-icon.png" alt="Search" />
            </button>
          </div>

          <button class="refreshBtn" id="refreshBtnHistory">
            <img src="assets/icons/refresh-icon.png" alt="Refresh" />
          </button>

          <button class="downloadBtn" id="downloadBtn">
            <img src="assets/icons/download-icon.png" alt="Download" />
          </button>
        </div>
      </div>

      <div class="tableWrapper">
        <table class="historyTable">
          <thead>
                      <tr>
                          <th class="sortable" data-sort="InvLogID">ID</th>
                          <th class="sortable" data-sort="ItemName">Name</th>
                          <th class="sortable" data-sort="Category">Category</th>
                          <th class="sortable" data-sort="OldQuantity">Old Qty</th>
                          <th class="sortable" data-sort="QuantityChange">Change</th>
                          <th class="sortable" data-sort="NewQuantity">New Qty</th>
                          <th class="sortable" data-sort="ItemStatus">Status</th>
                          <th class="sortable" data-sort="DateofStockIn">Stock In</th>
                          <th class="sortable" data-sort="PerformedBy">Performed By</th>
                      </tr>
                    </thead>
          <tbody id="historyTableBody">
            <tr><td colspan="9" style="text-align: center;">Loading...</td></tr>
          </tbody>
        </table>
        <div class="pagination" id="pagination-history"></div>
      </div>
    </div>
  </div>
  
<button class="add-item-btn" id="addItemBtn">
    ADD ITEM
    <i class="fas fa-plus"></i>
</button>

<div class="modal-overlay" id="add-item-modal">
    <div class="modal-content">
        <div class="modal-header">
            <div class="modal-title">
                <i class="fas fa-boxes-stacked modal-icon-fa"></i>
                <h2>Add Item</h2>
            </div>
            <button class="modal-close-btn" id="modal-close-btn">&times;</button>
        </div>
        <p class="modal-description">
            Please fill out the item details carefully before adding them to the inventory. 
            Ensure that all information is accurate to maintain proper stock records.
        </p>
        <div class="modal-body">
            <form id="add-item-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="item-name">Name</label>
                        <input type="text" id="item-name" required>
                    </div>
                     <div class="form-group category-group">
                        <label for="item-category">Category</label>
                        <select id="item-category" required>
                            <option value="" disabled selected>Select a category</option>
                            </select>
                    </div>
                </div>
                <div class="form-group"> <label for="item-description">Description</label>
                    <textarea id="item-description" rows="3"></textarea>
                </div>
                 <div class="form-row"> <div class="form-group">
                    <label for="item-quantity">Quantity</label>
                    <input type="number" id="item-quantity" min="0" required>
                </div>
                <div class="form-group">
                    <label for="stock-in-date">Stock In Date</label>
                    <input type="date" id="stock-in-date" required>
                </div>
                </div>
                <button type="submit" class="submit-btn">ADD ITEM</button>
            </form>
        </div>
    </div>
</div>

<div class="modal-overlay-confirm" id="confirmation-modal">
    <div class="modal-content-confirm">
        <h3>Are you sure you want to add this item to the inventory?</h3>
        <p>
            Please review the details before confirming.
            Once added, the item will be recorded and visible in the inventory list.
        </p>
        <div class="confirm-buttons">
            <button type="button" class="btn btn-cancel" id="confirm-cancel-btn">CANCEL</button>
            <button type="button" class="btn btn-confirm" id="confirm-add-btn">YES, ADD ITEM</button>
        </div>
    </div>
</div>

<div class="modal-overlay-success" id="success-modal">
    <div class="modal-content-success">
        <img src="inventory.jpg" alt="Success Icon" class="modal-icon" style="display: block; margin: 0 auto 20px;">
        <h3>Item Added Successfully</h3>
        <button type="button" class="btn btn-okay" id="success-okay-btn">OKAY</button>
    </div>
</div>

<div class="modal-overlay" id="edit-item-modal"> 
    <div class="modal-content">
        <div class="modal-header">
            <div class="modal-title">
                <h2>Edit Items</h2>
            </div>
             <button class="modal-close-btn" id="edit-modal-close-btn">&times;</button>
        </div>
        <div class="modal-body">
            <form id="edit-item-form">
                
                <input type="hidden" id="edit-item-id-input">
                
                <div class="form-group-static">
                    <label>ID</label>
                    <span id="edit-item-id">101</span>
                </div>

                <div class="form-group">
                    <label for="edit-item-name">Name</label>
                    <input type="text" id="edit-item-name" required>
                </div>
                
                <div class="form-group category-group">
                    <label for="edit-item-category">Category</label>
                    <select id="edit-item-category" required>
                        </select>
                </div>

                <div class="form-group">
                    <label for="edit-item-description">Description</label>
                    <textarea id="edit-item-description" rows="3"></textarea>
                </div>

                <div class="form-row form-row-align-bottom">
                    <div class="form-group form-group-static">
                        <label>Current Quantity</label>
                        <span id="edit-item-current-qty">0</span>
                    </div>
                    
                    <div class="form-group stock-adder-group">
                        <label for="edit-item-add-stock">Add Stock</label>
                        <input type="number" id="edit-item-add-stock" min="0" placeholder="0">
                    </div>
                </div>
                <div class="edit-modal-buttons">
                    <button type="button" class="submit-btn btn-cancel-white" id="edit-modal-cancel-btn">CANCEL</button>
                    <button type="submit" class="submit-btn">SAVE CHANGES</button>
                </div>
            </form>
        </div>
    </div>
</div>
<div class="modal-overlay" id="delete-confirm-modal">
    <div class="modal-content-confirm" style="max-width: 480px;" id="delete-confirm-modal-content">
        <button class="modal-close-btn" id="delete-modal-close-btn">&times;</button>
        <img src="assets/icons/warning-icon.png" alt="Warning" class="modal-icon" style="height: 50px; width: 50px; margin: 0 auto 20px;">
        
        <h3>Are you sure you want to delete this item from the inventory?</h3>
        <p>
            This action cannot be undone, and all related
            records will be permanently removed.
        </p>
        <div class="confirm-buttons">
            <button type="button" class="btn btn-delete-cancel" id="delete-cancel-btn">CANCEL</button>
            <button type="button" class="btn btn-delete-confirm" id="delete-confirm-btn">YES, DELETE ITEM</button>
        </div>
    </div>
</div>

  <script src="script/shared-data.js"></script>
  <script src="script/inventory.js?v=1.9"></script>
</body>

</html>