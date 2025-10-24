<?php
// 1. Start the session with the same secure settings
session_start([
  'cookie_httponly' => true,
  'cookie_secure' => isset($_SERVER['HTTPS']),
  'use_strict_mode' => true
]);

// 2. !! THE FIX !! 
// Tell the browser to not cache this page
header('Cache-Control: no-cache, no-store, must-revalidate'); // HTTP 1.1.
header('Pragma: no-cache'); // HTTP 1.0.
header('Expires: 0'); // Proxies.

// 3. Check if the user is actually logged in.
// If no UserID is in the session, they aren't logged in.
if (!isset($_SESSION['UserID'])) {
  // Redirect them to the login page
  header("Location: inventory_log_signin.php");
  exit();
}

// If they ARE logged in, the rest of the page will load.
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Celestia Hotel - Housekeeping Management</title>
  <link rel="stylesheet" href="css/housekeeping.css">
  <?php
  // ======================================================
  // === PHP Logic Orchestration (REQUIRED FILES) ===
  // ======================================================

  // 1. Load the database configuration and connection ($conn is now available)
  require_once('db_connection.php');

  // 2. Load the user data function
  require_once('User.php');

  // 3. Execute the function to get dynamic data
  $userData = getUserData($conn);

  // Set the variables used in the HTML, applying security (htmlspecialchars)
  $Fname = htmlspecialchars($userData['Name']);
  $Accounttype = htmlspecialchars($userData['Accounttype']); // Using Accounttype to match your error
  // Close the DB connection (optional, but good practice)
  $conn->close();

  ?>
  <!DOCTYPE html>
  <html lang="en">

<body>
  <!-- Header -->
  <header class="header">
    <div class="headerLeft">
      <img src="assets/images/celestia-logo.png" alt="Logo" class="headerLogo" />
      <span class="hotelName">THE CELESTIA HOTEL</span>
    </div>

    <!-- profile sidebar -->
  <img src="assets/icons/profile-icon.png" alt="Profile" class="profileIcon" id="profileBtn" />

<aside class="profile-sidebar" id="profile-sidebar">
    <button class="sidebar-close-btn" id="sidebar-close-btn">&times;</button>
    
    <div class="profile-header">
        <div class="profile-pic-container">
            <i class="fas fa-user-tie"></i>
        </div>
        <h3><?php echo $Fname; ?></h3>
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
            <option value="electrical">Electrical</option>
            <option value="cleaning solution">Cleaning solution</option>
            <option value="furniture & fixtures">Furniture & Fixtures</option>
            <option value="room amenities">Room Amenities</option>
          </select>

          <select class="filterDropdown" id="roomFilter">
            <option value="">Status</option>
            <option value="out of stock">Out of Stock</option>
            <option value="low stock">Low Stock</option>
            <option value="in stock">In Stock</option>
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
                                <th>ID</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Damage</th>
                                <th>Stock In Date</th>
                                <th>Stock Out Date</th>
                                <th></th> 
                            </tr>
          </thead>
          <tbody id="requestsTableBody">
            </tbody>
        </table>
      </div>
    </div>


    <div class="tabContent" id="history-tab">
      <div class="controlsRow">
        <div class="filterControls">
          <select class="filterDropdown" id="floorFilterHistory">
            <option value="">Category</option>
            <option value="electrical">Electrical</option>
            <option value="cleaning solution">Cleaning solution</option>
            <option value="furniture & fixtures">Furniture & Fixtures</option>
            <option value="room amenities">Room Amenities</option>
          </select>

          <select class="filterDropdown" id="roomFilterHistory">
            <option value="">Status</option>
            <option value="out of stock">Out of Stock</option>
            <option value="low stock">Low Stock</option>
            <option value="in stock">In Stock</option>
          </select>

          <div class="searchBox">
            <input type="text" placeholder="Search" class="searchInput" id="historySearchInput" />
            <button class="searchBtn">
              <img src="assets/icons/search-icon.png" alt="Search" />
            </button>
          </div>

          <button class="downloadBtn" id="downloadBtn">
            <img src="assets/icons/download-icon.png" alt="Download" />
          </button>
        </div>
      </div>

      <div class="tableWrapper">
        <table class="historyTable">
          <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Quantity Change</th>
                                <th>Status</th>
                                <th>Damage</th>
                                <th>Stock In Date</th>
                                <th>Stock Out Date</th>
                                <th>Action Type</th>
                                <th>Performed By</th>
                            </tr>
                        </thead>
          <tbody id="historyTableBody">
            </tbody>
        </table>
        <div class="pagination">
          <span class="paginationInfo">Display Records <span id="recordCount">0</span></span>
          <div class="paginationControls">
            <button class="paginationBtn">←</button>
            <button class="paginationBtn active">1</button>
            <button class="paginationBtn">2</button>
            <button class="paginationBtn">3</button>
            <button class="paginationBtn">4</button>
            <button class="paginationBtn">5</button>
            <span class="paginationDots">...</span>
            <button class="paginationBtn">10</button>
            <button class="paginationBtn">→</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
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
                        <label for="item-category">Category 
                            <i class="fas fa-pencil-alt category-edit-icon" id="add-category-edit-icon" title="Edit Categories"></i>
                        </label>
                        <select id="item-category" required>
                            <option value="" disabled selected>Select a category</option>
                            <option value="Cleaning solution">Cleaning Solution</option>
                            <option value="Electrical">Electrical</option>
                            <option value="Furniture & Fixtures">Furniture & Fixtures</option>
                            <option value="Room Amenities">Room Amenities</option>
                        </select>
                    </div>
                </div>
                <div class="form-group"> <label for="item-description">Description</label>
                    <textarea id="item-description" rows="3"></textarea>
                </div>
                 <div class="form-row"> <div class="form-group">
                    <label for="item-quantity">Quantity</label>
                    <input type="number" id="item-quantity" required>
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
                
                <div class="form-group-static">
                    <label>ID</label>
                    <span id="edit-item-id">101</span>
                </div>

                <div class="form-group">
                    <label for="edit-item-name">Name</label>
                    <input type="text" id="edit-item-name" required>
                </div>
                
                <div class="form-group category-group">
                    <label for="edit-item-category">Category
                        <i class="fas fa-pencil-alt category-edit-icon" id="edit-category-edit-icon" title="Edit Categories"></i>
                    </label>
                    <select id="edit-item-category" required>
                        <option value="Cleaning solution">Cleaning Solution</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Furniture & Fixtures">Furniture & Fixtures</option>
                        <option value="Room Amenities">Room Amenities</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="edit-item-description">Description</label>
                    <textarea id="edit-item-description" rows="3"></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group stock-adder-group">
                        
                        <label for="edit-item-add-stock">Adjust Stock</label>
                        
                        <div class="stock-input-wrapper">
                            <button type="button" class="stock-btn" id="stock-subtract-btn">-</button>
                            
                            <input type="number" id="edit-item-add-stock" value="0">
                            
                            <button type="button" class="stock-btn" id="stock-add-btn">+</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="edit-item-status">Status</label>
                        <select id="edit-item-status" required>
                            <option value="In Stock">In Stock</option>
                            <option value="Low Stock">Low Stock</option>
                            <option value="Out of Stock">Out of Stock</option>
                        </select>
                    </div>
                </div>

                <div class="edit-modal-buttons">
                    <button type="button" class="submit-btn btn-delete-inline" id="edit-modal-delete-btn">DELETE</button>
                    <button type="submit" class="submit-btn">SAVE CHANGES</button>
                </div>
            </form>
        </div>
    </div>
</div>
<div class="modal-overlay" id="delete-confirm-modal">
    <div class="modal-content-confirm" style="max-width: 480px;">
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

  </style>
  <script src="script/shared-data.js"></script>
  <script src="script/inventory.js"></script>
</body>

</html>