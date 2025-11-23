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

  <style>
    /* Style for the wrapper around category select and edit button */
    .category-select-wrapper {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .category-select-wrapper select {
        flex-grow: 1; /* Select box takes available space */
    }

    /* Style for the new 'Edit' button */
    .edit-category-btn {
        padding: 8px 12px;
        font-size: 13px;
        font-weight: 600;
        background-color: #ffc107; /* Yellow background like mockup */
        color: #212529; /* Dark text */
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.2s ease;
        flex-shrink: 0; /* Prevent button from shrinking */
    }

    .edit-category-btn:hover {
        background-color: #e0a800;
    }

    .edit-category-btn .fa-pencil-alt {
        margin-right: 5px;
    }

    /* Styles for the new "Manage Category" Modal */
    .add-category-wrapper {
        display: flex;
        gap: 10px;
    }

    .add-category-wrapper input {
        flex-grow: 1;
        width: auto; 
    }

    .add-category-wrapper .submit-btn {
        flex-shrink: 0;
        padding: 10px 15px;
        line-height: 1.5; 
        width: auto; 
    }
    
    .category-divider {
        border: none;
        border-top: 1px solid #eee;
        margin: 20px 0;
    }

    .category-list-container {
        max-height: 250px;
        overflow-y: auto;
        border: 1px solid #ddd;
        border-radius: 5px;
        padding: 10px;
        background: #fdfdfd;
    }

    .category-list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid #eee;
    }
    
    .category-list-item:last-child {
        border-bottom: none;
    }

    .category-list-item .category-name {
        font-size: 15px;
        color: #333;
        font-weight: 500;
    }

    .category-actions .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        color: #555;
        margin-left: 10px;
        transition: color 0.2s ease;
    }

    .category-actions .btn-edit-category:hover {
        color: #007bff; /* Blue */
    }
    
    .category-actions .btn-delete-category:hover {
        color: #dc3545; /* Red */
    }

    /* Footer for the category modal */
    .modal-footer {
        text-align: right; 
        padding: 15px 30px;
        border-top: 1px solid #eee;
        margin-top: 15px;
    }

    /* Small loading spinner */
    .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        animation: spin 1s linear infinite;
        margin: 20px auto;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* === CSS FIX FOR ORIENTATION === */
    .form-group-vertical {
        display: block; /* Override flex */
    }

    .form-group-vertical label {
        display: block; /* Ensure label is block-level */
        margin-bottom: 8px; /* Add spacing */
    }

    /* ========================================= */
    /* === FIX FOR CLOSE BUTTON POSITIONING === */
    /* ========================================= */
    #category-delete-confirm-modal .modal-content-confirm {
        position: relative; /* Essential for absolute positioning of the close button */
    }

    #category-delete-confirm-modal .modal-close-btn {
        position: absolute !important; /* Force position */
        top: 15px;
        right: 15px;
        background: none;
        border: none;
        font-size: 28px;
        color: #555; /* Default color, make sure it contrasts with background */
        cursor: pointer;
        padding: 0;
        margin: 0;
        z-index: 10; /* Ensure it's on top */
    }

    #category-delete-confirm-modal .modal-close-btn:hover {
        color: #dc3545; /* Red on hover */
    }

  </style>
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
    <h1 class="pageTitle">INVENTORY</h1>

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
                        <div class="category-select-wrapper">
                            <select id="item-category" required>
                                <option value="" disabled selected>Select a category</option>
                            </select>
                            <button type="button" class="edit-category-btn" id="open-category-modal-btn">
                                <i class="fas fa-pencil-alt"></i> Edit
                            </button>
                        </div>
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
        <img src="assets/icons/successful-icon.png" alt="Success Icon" class="modal-icon" style="display: block; margin: 0 auto 20px; width: 80px; height: 80px;">
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
                    <div class="category-select-wrapper">
                        <select id="edit-item-category" required>
                           </select>
                    </div>
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

<div class="modal-overlay" id="manage-category-modal">
    <div class="modal-content">
        <div class="modal-header">
            <div class="modal-title">
                <i class="fas fa-tags modal-icon-fa"></i>
                <h2>Manage Categories</h2>
            </div>
            <button class="modal-close-btn" id="category-modal-close-btn">&times;</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="new-category-name">Add New Category</label>
                <div class="add-category-wrapper">
                    <input type="text" id="new-category-name" placeholder="Enter new category name">
                    <button type="button" class="submit-btn" id="add-new-category-btn">ADD</button>
                </div>
            </div>

            <hr class="category-divider">

            <div class="form-group form-group-vertical">
                <label>Existing Categories</label>
                <div class="category-list-container" id="category-list-container">
                    <div class="spinner"></div> </div>
            </div>
        </div>
        <div class="modal-footer">
             <button type="button" class="submit-btn btn-cancel-white" id="category-modal-done-btn">DONE</button>
        </div>
    </div>
</div>

<div class="modal-overlay" id="edit-category-name-modal">
    <div class="modal-content" style="max-width: 400px;">
         <div class="modal-header">
            <div class="modal-title">
                <i class="fas fa-pencil-alt modal-icon-fa"></i>
                <h2>Edit Category</h2>
            </div>
            <button class="modal-close-btn" id="edit-category-name-close-btn">&times;</button>
        </div>
        <div class="modal-body">
            <form id="edit-category-name-form">
                <input type="hidden" id="edit-category-id-input">
                <div class="form-group">
                    <label for="edit-category-name-input">Category Name</label>
                    <input type="text" id="edit-category-name-input" required>
                </div>
                <div class="edit-modal-buttons">
                     <button type="button" class="submit-btn btn-cancel-white" id="edit-category-name-cancel-btn">CANCEL</button>
                     <button type="submit" class="submit-btn">SAVE</button>
                </div>
            </form>
        </div>
    </div>
</div>

<div class="modal-overlay-success" id="category-message-modal">
    <div class="modal-content-success">
        <div id="category-message-icon-container">
             <img src="assets/icons/successful-icon.png" alt="Icon" class="modal-icon" style="display: block; margin: 0 auto 20px; width: 80px; height: 80px;">
        </div>
        <h3 id="category-message-text">Message goes here</h3>
        <button type="button" class="btn btn-okay" id="category-message-okay-btn">OKAY</button>
    </div>
</div>

<div class="modal-overlay" id="category-delete-confirm-modal">
    <div class="modal-content-confirm" style="max-width: 480px;">
        <button class="modal-close-btn" id="cat-del-close-btn">&times;</button>
        
        <img src="assets/icons/warning-icon.png" alt="Warning" class="modal-icon" style="height: 50px; width: 50px; margin: 0 auto 20px;">
        
        <h3>Delete Category?</h3>
        <p id="cat-del-confirm-text">
            Are you sure you want to delete this category?
        </p>
        <div class="confirm-buttons">
            <button type="button" class="btn btn-delete-cancel" id="cat-del-cancel-btn">CANCEL</button>
            <button type="button" class="btn btn-delete-confirm" id="cat-del-confirm-btn">YES, DELETE</button>
        </div>
    </div>
</div>

<script src="script/shared-data.js"></script>
<script src="script/inventory.js?v=1.9"></script>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        
        // --- 1. Modal DOM Elements (Existing) ---
        const categoryModal = document.getElementById('manage-category-modal');
        const openCategoryModalBtn = document.getElementById('open-category-modal-btn');
        const closeCategoryModalBtn = document.getElementById('category-modal-close-btn');
        const doneCategoryModalBtn = document.getElementById('category-modal-done-btn');
        
        const editCategoryNameModal = document.getElementById('edit-category-name-modal');
        const editCategoryNameForm = document.getElementById('edit-category-name-form');
        const editCategoryNameCloseBtn = document.getElementById('edit-category-name-close-btn');
        const editCategoryNameCancelBtn = document.getElementById('edit-category-name-cancel-btn');
        const editCategoryIdInput = document.getElementById('edit-category-id-input');
        const editCategoryNameInput = document.getElementById('edit-category-name-input');

        // --- 2. NEW Modal DOM Elements (Replacements for Alert/Confirm) ---
        const categoryMessageModal = document.getElementById('category-message-modal');
        const categoryMessageText = document.getElementById('category-message-text');
        const categoryMessageIconContainer = document.getElementById('category-message-icon-container');
        const categoryMessageOkayBtn = document.getElementById('category-message-okay-btn');

        const categoryDeleteModal = document.getElementById('category-delete-confirm-modal');
        const catDelConfirmText = document.getElementById('cat-del-confirm-text');
        const catDelCloseBtn = document.getElementById('cat-del-close-btn');
        const catDelCancelBtn = document.getElementById('cat-del-cancel-btn');
        const catDelConfirmBtn = document.getElementById('cat-del-confirm-btn');

        // --- 3. Category List & Inputs ---
        const categoryListContainer = document.getElementById('category-list-container');
        const addNewCategoryBtn = document.getElementById('add-new-category-btn');
        const newCategoryNameInput = document.getElementById('new-category-name');

        // --- 4. State Variables ---
        let categoryIdToDelete = null; // Stores ID when trash icon is clicked
        
        // --- Select Dropdowns to Update ---
        const allCategoryDropdowns = [
            document.getElementById('item-category'),
            document.getElementById('edit-item-category'),
            document.getElementById('floorFilter'),
            document.getElementById('floorFilterHistory')
        ];

        const API_URL = 'inventory_actions.php';

        // ============================================================
        // === HELPER FUNCTIONS FOR NEW MODALS
        // ============================================================

        // Show a Success or Error Message Modal instead of alert()
        function showCategoryMessage(message, type = 'success') {
            categoryMessageText.textContent = message;
            
            if (type === 'error') {
                // Use a warning/error icon
                categoryMessageIconContainer.innerHTML = '<img src="assets/icons/warning-icon.png" alt="Error" class="modal-icon" style="display: block; margin: 0 auto 20px; width: 60px; height: 60px;">';
            } else {
                // Use success icon
                categoryMessageIconContainer.innerHTML = '<img src="assets/icons/successful-icon.png" alt="Success" class="modal-icon" style="display: block; margin: 0 auto 20px; width: 80px; height: 80px;">';
            }
            
            categoryMessageModal.classList.add('show-modal'); 
            categoryMessageModal.style.display = 'flex'; 
        }

        function closeCategoryMessage() {
            categoryMessageModal.classList.remove('show-modal');
            categoryMessageModal.style.display = 'none';
        }

        categoryMessageOkayBtn.addEventListener('click', closeCategoryMessage);

        // Show Delete Confirmation Modal
        function showCategoryDeleteModal(id, name) {
            categoryIdToDelete = id;
            catDelConfirmText.textContent = `Are you sure you want to delete the category "${name}"? This cannot be undone.`;
            categoryDeleteModal.style.display = 'flex';
        }

        function closeCategoryDeleteModal() {
            categoryIdToDelete = null;
            categoryDeleteModal.style.display = 'none';
        }

        catDelCloseBtn.addEventListener('click', closeCategoryDeleteModal);
        catDelCancelBtn.addEventListener('click', closeCategoryDeleteModal);

        // ============================================================
        // === CORE LOGIC
        // ============================================================

        // --- Open/Close Main Category Modal ---
        openCategoryModalBtn.addEventListener('click', () => {
            categoryModal.style.display = 'flex';
            loadCategories();
        });

        closeCategoryModalBtn.addEventListener('click', () => {
            categoryModal.style.display = 'none';
        });

        doneCategoryModalBtn.addEventListener('click', () => {
            categoryModal.style.display = 'none';
        });

        // --- Open/Close Edit Category Name Modal ---
        function openEditCategoryNameModal(id, name) {
            editCategoryIdInput.value = id;
            editCategoryNameInput.value = name;
            editCategoryNameModal.style.display = 'flex';
        }

        function closeEditCategoryNameModal() {
            editCategoryNameModal.style.display = 'none';
        }
        
        editCategoryNameCloseBtn.addEventListener('click', closeEditCategoryNameModal);
        editCategoryNameCancelBtn.addEventListener('click', closeEditCategoryNameModal);

        // --- Load Categories ---
        async function loadCategories() {
            categoryListContainer.innerHTML = '<div class="spinner"></div>';
            try {
                const response = await fetch(`${API_URL}?action=get_categories`);
                if (!response.ok) throw new Error('Network response was not ok');
                
                const categories = await response.json();
                
                categoryListContainer.innerHTML = '';
                if (categories.length === 0) {
                    categoryListContainer.innerHTML = '<p style="text-align:center; color: #777;">No categories found.</p>';
                } else {
                    categories.forEach(category => {
                        const item = document.createElement('div');
                        item.className = 'category-list-item';
                        item.dataset.id = category.ItemCategoryID;
                        item.innerHTML = `
                            <span class="category-name">${escapeHTML(category.ItemCategoryName)}</span>
                            <div class="category-actions">
                                <button class="btn-icon btn-edit-category" title="Edit"><i class="fas fa-pencil-alt"></i></button>
                                <button class="btn-icon btn-delete-category" title="Delete"><i class="fas fa-trash-alt"></i></button>
                            </div>
                        `;
                        categoryListContainer.appendChild(item);
                    });
                }
            } catch (error) {
                console.error('Error loading categories:', error);
                categoryListContainer.innerHTML = '<p style="text-align:center; color: red;">Failed to load categories.</p>';
            }
        }

        // --- Refresh Dropdowns ---
        async function refreshCategoryDropdowns() {
            try {
                const response = await fetch(`${API_URL}?action=get_categories`);
                if (!response.ok) throw new Error('Network response was not ok');
                
                const categories = await response.json();
                
                allCategoryDropdowns.forEach(dropdown => {
                    if (!dropdown) return;
                    const currentValue = dropdown.value;
                    while (dropdown.options.length > 1) { dropdown.remove(1); }

                    const isFormDropdown = (dropdown.id === 'item-category' || dropdown.id === 'edit-item-category');
                    
                    categories.forEach(category => {
                        const option = document.createElement('option');
                        if (isFormDropdown) {
                            option.value = category.ItemCategoryID;
                        } else {
                            option.value = category.ItemCategoryName;
                        }
                        option.textContent = escapeHTML(category.ItemCategoryName);
                        dropdown.appendChild(option);
                    });

                    dropdown.value = currentValue;
                    if(dropdown.value !== currentValue && isFormDropdown) {
                         dropdown.value = ""; 
                    }
                });
            } catch (error) {
                 console.error('Error refreshing category dropdowns:', error);
            }
        }

        // --- ADD Category Logic ---
        addNewCategoryBtn.addEventListener('click', async () => {
            const newName = newCategoryNameInput.value.trim();
            if (!newName) {
                showCategoryMessage('Please enter a category name.', 'error');
                return;
            }

            try {
                const formData = new FormData();
                formData.append('CategoryName', newName);

                const response = await fetch(`${API_URL}?action=add_category`, {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();

                if (result.success) {
                    newCategoryNameInput.value = ''; 
                    await loadCategories();
                    await refreshCategoryDropdowns();
                    // Optional: Show success message or just silent update
                    // showCategoryMessage('Category added successfully!', 'success');
                } else {
                    showCategoryMessage(result.message || 'Failed to add category.', 'error');
                }
            } catch (error) {
                console.error('Error adding category:', error);
                showCategoryMessage('An error occurred. Please try again.', 'error');
            }
        });

        // --- DELETE Category Logic (Event Delegation) ---
        categoryListContainer.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-edit-category');
            const deleteBtn = e.target.closest('.btn-delete-category');
            const item = e.target.closest('.category-list-item');

            if (!item) return; 

            const categoryId = item.dataset.id;
            const categoryName = item.querySelector('.category-name').textContent;
            
            // Handle Edit Click
            if (editBtn) {
                openEditCategoryNameModal(categoryId, categoryName);
            }
            
            // Handle Delete Click (Opens Modal instead of Confirm)
            if (deleteBtn) {
                showCategoryDeleteModal(categoryId, categoryName);
            }
        });

        // --- ACTUAL DELETE EXECUTION (When "Yes" is clicked in new modal) ---
        catDelConfirmBtn.addEventListener('click', async () => {
            if (!categoryIdToDelete) return;

            try {
                const formData = new FormData();
                formData.append('CategoryID', categoryIdToDelete);

                const response = await fetch(`${API_URL}?action=delete_category`, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                // Close delete modal
                closeCategoryDeleteModal();

                if (result.success) {
                    await loadCategories();
                    await refreshCategoryDropdowns();
                    showCategoryMessage('Category deleted successfully.', 'success');
                } else {
                    showCategoryMessage(result.message || 'Failed to delete category.', 'error');
                }
            } catch (error) {
                console.error('Error deleting category:', error);
                closeCategoryDeleteModal();
                showCategoryMessage('An error occurred. Please try again.', 'error');
            }
        });

        // --- UPDATE Category Logic ---
        editCategoryNameForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const categoryId = editCategoryIdInput.value;
            const newName = editCategoryNameInput.value.trim();

            if (!newName) {
                showCategoryMessage('Please enter a category name.', 'error');
                return;
            }

            try {
                const formData = new FormData();
                formData.append('CategoryID', categoryId);
                formData.append('CategoryName', newName);

                const response = await fetch(`${API_URL}?action=update_category`, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                if (result.success) {
                    closeEditCategoryNameModal();
                    await loadCategories();
                    await refreshCategoryDropdowns();
                    showCategoryMessage('Category updated successfully.', 'success');
                } else {
                    showCategoryMessage(result.message || 'Failed to update category.', 'error');
                }
            } catch (error) {
                console.error('Error updating category:', error);
                showCategoryMessage('An error occurred. Please try again.', 'error');
            }
        });

        // --- Utility Function ---
        function escapeHTML(str) {
            if (typeof str !== 'string') return '';
            return str.replace(/[&<>"']/g, function(m) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
            });
        }
        
    });
</script>
</body>
</html>