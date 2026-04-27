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
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>

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
        padding: 12px 14px;
        font-size: 13px;
        font-weight: 600;
        background-color: #480c1b; /* Maroon background to match other buttons */
        color: #fff; /* White text */
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.2s ease;
        flex-shrink: 0; /* Prevent button from shrinking */
        min-height: 44px; /* Match form element height */
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px; /* Square button for icon only */
    }

    .edit-category-btn:hover {
        background-color: #5a0e22;
    }

    .edit-category-btn .fa-pencil-alt {
        margin: 0; /* No margin needed since no text */
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
    
   .category-actions .btn-archive-category:hover {
        color: #dc3545; 
    }
    
    /* Restore Button (Green) */
    .category-actions .btn-restore-category {
        color: #28a745; 
        margin-left: 10px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
    }
    .category-actions .btn-restore-category:hover {
        color: #218838; 
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
    <p class="pageDescription">Track hotel supplies, manage stock levels, and monitor inventory transactions</p>

   <div class="tabNavigation">
      <button class="tabBtn active" data-tab="requests">
        <img src="assets/icons/inventory-log.png" alt="Requests" class="tabIcon" />
        Stocks
      </button>
      <button class="tabBtn" data-tab="history">
        <img src="assets/icons/history-icon.png" alt="History" class="tabIcon" />
        History
      </button>
      <button class="tabBtn" data-tab="budget">
        <i class="fas fa-file-invoice-dollar tabIcon" style="font-size: 18px; margin-right: 8px;"></i>
        Budget Request
      </button>
      
      <button class="tabBtn" data-tab="budget-logs">
        <i class="fas fa-chart-line tabIcon" style="font-size: 18px; margin-right: 8px;"></i>
        Budget Logs
      </button>
      
    </div>

    <div class="tabContent active" id="requests-tab">
     <div class="controlsRow">
        <div class="filterControls">
          <select class="filterDropdown" id="typeFilter">
            <option value="">Types</option>
            <option value="Consumables">Consumables</option>
            <option value="Reusable">Reusable</option>
            <option value="Equipment">Equipment</option>
          </select>

          <select class="filterDropdown" id="floorFilter">
            <option value="">Category</option>
          </select>

          <select class="filterDropdown" id="roomFilter">
            <option value="">Status</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Critical">Critical</option>
            <option value="Threshold">Threshold</option>
            <option value="In Stock">In Stock</option>
            <option value="Archived" style="color: red; font-weight: bold;">Archived</option>
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
          
           <button class="addItemBtn" id="addItemBtn">
             <img src="assets/icons/add.png" alt="Add Item" />
           </button>
        </div>
      </div>
      <div class="tableWrapper">
        <table class="requestsTable">
       <thead>
            <tr>
              <th class="sortable" data-sort="ItemName">Name</th>
              <th class="sortable" data-sort="ItemType">Type</th>
              <th class="sortable" data-sort="Category">Category</th>
              <th class="sortable" data-sort="ItemQuantity">Qty</th>
              <th class="sortable" data-sort="ItemUnit">Unit</th>
              <th class="sortable" data-sort="UnitCost">Unit Cost</th>
              <th class="sortable" data-sort="TotalValue">Total Value</th>
              <th class="sortable" data-sort="ExpirationDate">Expiry</th>
              <th class="sortable" data-sort="RestockDate" style="text-align: center;">Restock Deadline</th>
              <th class="sortable" data-sort="ItemStatus">Status</th>
              <th>Action</th> 
            </tr>
          </thead>
          <tbody id="requestsTableBody">
            <tr><td colspan="11" style="text-align: center;">Loading...</td></tr> 
          </tbody>
        </table>
      </div>
      <div class="pagination" id="pagination-stocks"></div>
    </div>

    <div class="tabContent" id="history-tab">

   <div class="controlsRow">
        <div class="filterControls">
          <select class="filterDropdown" id="typeFilterHistory">
            <option value="">Types</option>
            <option value="Consumables">Consumables</option>
            <option value="Reusable">Reusable</option>
            <option value="Equipment">Equipment</option>
          </select>

          <select class="filterDropdown" id="floorFilterHistory">
            <option value="">Category</option>
          </select>

          <select class="filterDropdown" id="roomFilterHistory">
            <option value="">Status</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Critical">Critical</option>
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
    <div class="tabContent" id="budget-tab">
      
      <div style="background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e0e0e0; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <div style="flex: 1; margin-right: 30px;">
              <label style="display: block; font-size: 13px; color: #666; font-weight: normal; margin-bottom: 8px;">Select Category to View Budget:</label>
              <select class="filterDropdown" id="globalBudgetCategorySelect" style="width: 100%; max-width: 350px; padding: 12px 14px; font-size: 14px; border-radius: 8px; border: 2px solid #e0e0e0; background: #fff; cursor: pointer; transition: border 0.2s; font-family: 'Arial', sans-serif;">
                  <option value="" selected>-- Select Category --</option>
              </select>
          </div>
          <div style="text-align: right; padding-left: 30px;">
              <span style="display: block; font-size: 13px; color: #666; font-weight: normal; margin-bottom: 5px;">Available Budget:</span>
              <span id="global-available-budget" style="font-size: 32px; font-weight: 700; color: #28a745; display: block; letter-spacing: -0.5px;">₱0.00</span>
          </div>
      </div>

      <div class="controlsRow">
        <div class="filterControls">
          <select class="filterDropdown" id="budgetStatusFilter">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button class="addItemBtn" id="addBudgetBtn" style="width: auto; padding: 10px 20px; font-weight: 600; background-color: #480c1b; color: #fff; border: none; border-radius: 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.2s; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 16px; font-weight: 700;">+</span> NEW REQUEST
          </button>
        </div>
      </div>
      
      <div class="tableWrapper">
        <table class="requestsTable">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Category</th>
              <th>Description</th>
              <th>Requested Amount</th>
              <th>Requested By</th>
              <th>Date Requested</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="budgetTableBody">
            <tr><td colspan="8" style="text-align: center;">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div> <div class="tabContent" id="budget-logs-tab">
      <div class="controlsRow">
        <div class="filterControls">
          <select class="filterDropdown" id="budgetLogCategoryFilter">
            <option value="">All Categories</option>
          </select>
          <div class="searchBox">
            <input type="text" placeholder="Search logs..." class="searchInput" id="searchBudgetLogs" />
            <button class="searchBtn">
              <img src="assets/icons/search-icon.png" alt="Search" />
            </button>
          </div>
        </div>
      </div>
      <div class="tableWrapper">
        <table class="requestsTable">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Category</th>
              <th>Item Stocked</th>
              <th>Qty</th>
              <th>Unit Price (₱)</th>
              <th>Total Deducted (₱)</th>
              <th>Remaining Budget (₱)</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody id="budgetLogsTableBody">
            <tr><td colspan="8" style="text-align: center;">Loading budget logs...</td></tr>
          </tbody>
        </table>
      </div>
    </div> 
</div>
<div class="modal-overlay" id="add-item-modal">
    <div class="modal-content">
        <div class="modal-header">
            <div class="modal-title">
                <h2>Add Item</h2>
            </div>
            <button class="modal-close-btn" id="modal-close-btn">&times;</button>
        </div>
        <div style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; margin-bottom: 15px;">
            <div style="font-size: 13px; font-weight: normal; color: #666; margin-bottom: 3px;">Available Budget:</div>
            <div id="add-modal-available-budget" style="font-size: 18px; font-weight: 700; color: #28a745;">₱0.00</div>
        </div>
        <div class="modal-body">
            <form id="add-item-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="item-name">Name</label>
                        <input type="text" id="item-name" required>
                    </div>
                    <div class="form-group">
                        <label for="item-type">Type</label>
                        <select id="item-type" required onchange="toggleAddExpiration()">
                            <option value="" disabled selected>Select Type</option>
                            <option value="Consumables">Consumables</option>
                            <option value="Reusable">Reusable</option>
                            <option value="Equipment">Equipment</option>
                        </select>
                    </div>
<div class="form-group category-group">
    <label for="item-category">Category</label>
    <div class="category-select-wrapper">
        <select id="item-category" required>
            <option value="" disabled selected>Select a category</option>
        </select>
        <button type="button" class="edit-category-btn" id="open-category-modal-btn" title="Edit Categories">
            <i class="fas fa-pencil-alt"></i>
        </button>
    </div>
</div>
</div> <div class="form-group"> <label for="item-description">Description</label>
                    <textarea id="item-description" rows="2"></textarea>
                </div>
                 <div class="form-row"> 
                    <div class="form-group">
                        <label for="item-quantity">Quantity</label>
                        <input type="number" id="item-quantity" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="item-unit">Unit</label>
                        <select id="item-unit" required>
                            <option value="" disabled selected>Select Unit</option>
                            <option value="pcs">pcs (pieces)</option>
                            <option value="box">box</option>
                            <option value="pack">pack</option>
                            <option value="set">set</option>
                            <option value="bottle">bottle</option>
                            <option value="gallon">gallon</option>
                            <option value="kg">kg</option>
                            <option value="liter">liter</option>
                            <option value="roll">roll</option>
                            <option value="pair">pair</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="item-unit-cost">Unit Cost (₱)</label>
                        <input type="number" id="item-unit-cost" min="0" step="0.01" value="0.00" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="item-limit">Stock Limit (Max) <span style="color:red">*</span></label>
                        <input type="number" id="item-limit" min="1" placeholder="Triggers alerts when low" required>
                    </div>
                    <div class="form-group">
                        <label for="stock-in-date">Stock In Date</label>
                        <input type="date" id="stock-in-date" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group" id="expiration-group" style="display: none;">
                        <label for="item-expiration">Expiration Date <span style="color:red">*</span></label>
                        <input type="date" id="item-expiration">
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
        <div style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; margin-bottom: 15px;">
            <div style="font-size: 13px; font-weight: normal; color: #666; margin-bottom: 3px;">Available Budget:</div>
            <div id="edit-modal-available-budget" style="font-size: 18px; font-weight: 700; color: #28a745;">₱0.00</div>
        </div>
        <div class="modal-body">
            <form id="edit-item-form">
                <input type="hidden" id="edit-item-id-input">
                <div class="form-group-static">
                    <label>ID</label>
                    <span id="edit-item-id">101</span>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-item-name">Name</label>
                        <input type="text" id="edit-item-name" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-item-type">Type</label>
                        <select id="edit-item-type" required onchange="toggleEditExpiration()">
                            <option value="Consumables">Consumables</option>
                            <option value="Reusable">Reusable</option>
                            <option value="Equipment">Equipment</option>
                        </select>
                    </div>
   <div class="form-group category-group">
    <label for="edit-item-category">Category</label>
    <div class="category-select-wrapper">
        <select id="edit-item-category" required></select>
    </div>
</div>
</div> <div class="form-group">
                    <label for="edit-item-description">Description</label>
                    <textarea id="edit-item-description" rows="2"></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-item-unit">Unit</label>
                        <select id="edit-item-unit" required>
                            <option value="" disabled selected>Select Unit</option>
                            <option value="pcs">pcs (pieces)</option>
                            <option value="box">box</option>
                            <option value="pack">pack</option>
                            <option value="set">set</option>
                            <option value="bottle">bottle</option>
                            <option value="gallon">gallon</option>
                            <option value="kg">kg</option>
                            <option value="liter">liter</option>
                            <option value="roll">roll</option>
                            <option value="pair">pair</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-item-unit-cost">Unit Cost (₱)</label>
                        <input type="number" id="edit-item-unit-cost" min="0" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-item-limit">Stock Limit (Max) <span style="color:red">*</span></label>
                        <input type="number" id="edit-item-limit" min="1" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group" id="edit-expiration-group" style="display: none;">
                        <label for="edit-item-expiration">Expiration Date <span style="color:red">*</span></label>
                        <input type="date" id="edit-item-expiration">
                    </div>
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
        
        <h3>Are you sure you want to archive this item?</h3>
        <p>
            This action will move the item to the archives. It will no longer appear in the active inventory list.
        </p>
        <div class="confirm-buttons">
            <button type="button" class="btn btn-delete-cancel" id="delete-cancel-btn">CANCEL</button>
            <button type="button" class="btn btn-delete-confirm" id="delete-confirm-btn">YES, ARCHIVE ITEM</button>
        </div>
    </div>
</div>

<div class="modal-overlay" id="restore-confirm-modal">
    <div class="modal-content-confirm" style="max-width: 480px;">
        <button class="modal-close-btn" id="restore-modal-close-btn">&times;</button>
        <img src="assets/icons/refresh-icon.png" alt="Restore" class="modal-icon" style="height: 50px; width: 50px; margin: 0 auto 20px;">
        
        <h3>Restore Item?</h3>
        <p>
            This item will be moved back to the active inventory list.
        </p>
        <div class="confirm-buttons">
            <button type="button" class="btn btn-delete-cancel" id="restore-cancel-btn">CANCEL</button>
            <button type="button" class="btn btn-confirm" id="restore-confirm-btn">YES, RESTORE</button>
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
                    <select id="new-category-type" required style="padding: 8px; border: 1px solid #ccc; border-radius: 4px; width: 130px; flex-shrink: 0;">
                        <option value="Consumables">Consumables</option>
                        <option value="Reusable">Reusable</option>
                        <option value="Equipment">Equipment</option>
                    </select>
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
                    <label for="edit-category-type-input">Item Type</label>
                    <select id="edit-category-type-input" required>
                        <option value="Consumables">Consumables</option>
                        <option value="Reusable">Reusable</option>
                        <option value="Equipment">Equipment</option>
                    </select>
                </div>
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
        
        <h3 id="cat-modal-title">Archive Category?</h3>
        
        <p id="cat-del-confirm-text">
            Are you sure you want to archive this category?
        </p>
        <div class="confirm-buttons">
            <button type="button" class="btn btn-delete-cancel" id="cat-del-cancel-btn">CANCEL</button>
            <button type="button" class="btn btn-delete-confirm" id="cat-del-confirm-btn">YES, ARCHIVE</button>
        </div>
    </div>
</div>
<div class="modal-overlay" id="budget-request-modal">
    <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
            <div class="modal-title">
                <h2>Budget Request</h2>
            </div>
            <button class="modal-close-btn" id="closeBudgetModal">&times;</button>
        </div>

        <div class="modal-body">
            <form id="budgetForm">
                <input type="hidden" id="budget-request-id">
                
                <div class="form-group">
                    <label for="budget-category">Budget Category <span style="color:red">*</span></label>
                    <select id="budget-category" required>
                        <option value="" disabled selected>Select Category...</option>
                    </select>
                </div>
                
                <div class="form-group" style="margin-top: 20px;">
                    <label for="budget-description">Description <span style="color:red">*</span></label>
                    <textarea id="budget-description" rows="3" placeholder="List the items you need to buy here..." required></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="budget-amount">Requested Amount (₱) <span style="color:red">*</span></label>
                        <input type="number" id="budget-amount" step="0.01" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="budget-priority">Priority</label>
                        <select id="budget-priority" required>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="budget-remarks">Remarks / Purpose</label>
                    <textarea id="budget-remarks" rows="2" placeholder="Why is this budget needed?"></textarea>
                </div>
                
                <button type="submit" class="submit-btn" id="submitBudgetBtn">SUBMIT REQUEST</button>
            </form>
        </div>
    </div>
</div>
</div>
<div class="modal-overlay" id="budget-confirm-modal">
    <div class="modal-content-confirm" style="max-width: 480px; position: relative;">
        <button class="modal-close-btn" id="budget-modal-close-btn">&times;</button>
        <i class="fas fa-file-invoice-dollar modal-icon" style="font-size: 40px; color: #007bff; display: block; text-align: center; margin-bottom: 20px;"></i>
        
        <h3 style="text-align: center;">Confirm Budget Request</h3>
        <p style="text-align: center; color: #555;">
            Are you sure you want to submit this budget request to Finance?
        </p>
        <div class="confirm-buttons" style="margin-top: 20px;">
            <button type="button" class="btn btn-cancel" id="budget-cancel-btn">CANCEL</button>
            <button type="button" class="btn btn-confirm" id="budget-confirm-btn" style="background-color: #007bff; border: none;">YES, SUBMIT</button>
        </div>
    </div>
</div>

<script src="script/shared-data.js"></script>
<script src="script/inventory.js?v=1.9"></script>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        
        // --- 1. Modal DOM Elements ---
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

        // --- 2. Message & Confirm Modals ---
        const categoryMessageModal = document.getElementById('category-message-modal');
        const categoryMessageText = document.getElementById('category-message-text');
        const categoryMessageIconContainer = document.getElementById('category-message-icon-container');
        const categoryMessageOkayBtn = document.getElementById('category-message-okay-btn');

        const categoryDeleteModal = document.getElementById('category-delete-confirm-modal');
        const catDelConfirmText = document.getElementById('cat-del-confirm-text');
        const catModalTitle = document.getElementById('cat-modal-title');
        const catDelCloseBtn = document.getElementById('cat-del-close-btn');
        const catDelCancelBtn = document.getElementById('cat-del-cancel-btn');
        const catDelConfirmBtn = document.getElementById('cat-del-confirm-btn');

        // --- 3. Category List & Inputs ---
        const categoryListContainer = document.getElementById('category-list-container');
        const addNewCategoryBtn = document.getElementById('add-new-category-btn');
        const newCategoryNameInput = document.getElementById('new-category-name');

        // --- 4. State Variables ---
        let categoryIdToArchive = null; 
        
        // --- Select Dropdowns to Update ---
        const allCategoryDropdowns = [
            document.getElementById('item-category'),
            document.getElementById('edit-item-category'),
            document.getElementById('floorFilter'),
            document.getElementById('floorFilterHistory')
        ];

        const API_URL = 'inventory_actions.php';

        // ============================================================
        // === HELPER FUNCTIONS
        // ============================================================

        function showCategoryMessage(message, type = 'success') {
            categoryMessageText.textContent = message;
            if (type === 'error') {
                categoryMessageIconContainer.innerHTML = '<img src="assets/icons/warning-icon.png" alt="Error" class="modal-icon" style="display: block; margin: 0 auto 20px; width: 60px; height: 60px;">';
            } else {
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

        function showCategoryArchiveModal(id, name) {
            categoryIdToArchive = id;
            if(catModalTitle) catModalTitle.textContent = "Archive Category?";
            catDelConfirmText.textContent = `Are you sure you want to archive "${name}"? It will be hidden from the 'Add Item' list.`;
            catDelConfirmBtn.textContent = "YES, ARCHIVE";
            categoryDeleteModal.style.display = 'flex';
        }

        function closeCategoryArchiveModal() {
            categoryIdToArchive = null;
            categoryDeleteModal.style.display = 'none';
        }

        catDelCloseBtn.addEventListener('click', closeCategoryArchiveModal);
        catDelCancelBtn.addEventListener('click', closeCategoryArchiveModal);

        function escapeHTML(str) {
            if (typeof str !== 'string') return '';
            return str.replace(/[&<>"']/g, function(m) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
            });
        }

        // ============================================================
        // === CORE LOGIC
        // ============================================================

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

        // --- UPDATED: LOAD CATEGORIES (Active first, then Archived) ---
        window.allSystemCategories = [];

        async function refreshCategoryDropdowns() {
            try {
                const response = await fetch(`${API_URL}?action=get_categories`);
                if (!response.ok) throw new Error('Network response was not ok');
                
                window.allSystemCategories = await response.json();
                
                const filterDropdowns = [
                    document.getElementById('floorFilter'),
                    document.getElementById('floorFilterHistory')
                ];

                filterDropdowns.forEach(dropdown => {
                    if (!dropdown) return;
                    const currentValue = dropdown.value;
                    while (dropdown.options.length > 1) { dropdown.remove(1); }
                    
                    window.allSystemCategories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.ItemCategoryName;
                        option.textContent = category.ItemCategoryName;
                        dropdown.appendChild(option);
                    });
                    dropdown.value = currentValue;
                });

                // Auto-filter based on current Add/Edit form types
                filterCategoriesByType('item-type', 'item-category');
                filterCategoriesByType('edit-item-type', 'edit-item-category');

            } catch (error) { console.error('Error refreshing dropdowns:', error); }
        }

        // The Smart Filter
        window.filterCategoriesByType = function(typeSelectId, categorySelectId) {
            const typeSelect = document.getElementById(typeSelectId);
            const catSelect = document.getElementById(categorySelectId);
            if (!typeSelect || !catSelect || !window.allSystemCategories) return;

            const selectedType = typeSelect.value;
            const currentCatId = catSelect.value;

            while (catSelect.options.length > 1) { catSelect.remove(1); }

            // --- FIX: Show all categories if no Type is selected ---
            const filtered = window.allSystemCategories.filter(c => {
                if (c.is_archived == 1) return false;
                if (!selectedType) return true; // Show all if blank
                return c.ItemType === selectedType;
            });

            filtered.forEach(category => {
                const option = document.createElement('option');
                option.value = category.ItemCategoryID;
                option.textContent = category.ItemCategoryName;
                catSelect.appendChild(option);
            });

            catSelect.value = currentCatId;
            if(catSelect.value !== currentCatId) catSelect.value = ""; 
        };

        // --- LOAD CATEGORIES (Active first, then Archived) ---
        async function loadCategories() {
            categoryListContainer.innerHTML = '<div class="spinner"></div>';
            try {
                // Ensure we have the latest data
                const response = await fetch(`${API_URL}?action=get_categories`);
                window.allSystemCategories = await response.json();
                
                categoryListContainer.innerHTML = '';
                if (window.allSystemCategories.length === 0) {
                    categoryListContainer.innerHTML = '<p style="text-align:center; color: #777;">No categories found.</p>';
                } else {
                    const activeCategories = window.allSystemCategories.filter(c => c.is_archived == 0);
                    const archivedCategories = window.allSystemCategories.filter(c => c.is_archived == 1);

                    activeCategories.forEach(category => renderCategoryItem(category));

                    if (archivedCategories.length > 0) {
                        const separator = document.createElement('div');
                        separator.textContent = "Archived";
                        separator.style.cssText = "padding: 10px 5px; font-weight: bold; color: #888; border-top: 1px solid #eee; margin-top: 5px; font-size: 13px; text-transform: uppercase;";
                        categoryListContainer.appendChild(separator);

                        archivedCategories.forEach(category => renderCategoryItem(category));
                    }
                }
            } catch (error) {
                console.error('Error loading categories:', error);
                categoryListContainer.innerHTML = '<p style="text-align:center; color: red;">Failed to load categories.</p>';
            }
        }

        // --- RENDER SINGLE CATEGORY ITEM ---
        function renderCategoryItem(category) {
            const isArchived = category.is_archived == 1;
            const item = document.createElement('div');
            item.className = 'category-list-item';
            item.dataset.id = category.ItemCategoryID;
            item.dataset.type = category.ItemType || 'Consumables'; 
            
            let buttonsHtml = isArchived 
                ? `<button class="btn-icon btn-restore-category"><i class="fas fa-trash-restore"></i></button>` 
                : `<button class="btn-icon btn-edit-category"><i class="fas fa-pencil-alt"></i></button> 
                   <button class="btn-icon btn-archive-category"><i class="fas fa-archive"></i></button>`;

            item.innerHTML = `
                <div>
                    <span class="category-name" style="${isArchived ? 'text-decoration: line-through; color: #999;' : ''}">${escapeHTML(category.ItemCategoryName)}</span>
                    <span style="font-size: 11px; color: #888; background: #eee; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">${escapeHTML(category.ItemType || 'Consumables')}</span>
                </div>
                <div class="category-actions">${buttonsHtml}</div>
            `;
            categoryListContainer.appendChild(item);
        }

        // --- MODAL OPENER ---
        function openEditCategoryNameModal(id, name, type) {
            editCategoryIdInput.value = id;
            editCategoryNameInput.value = name;
            document.getElementById('edit-category-type-input').value = type || 'Consumables'; 
            editCategoryNameModal.style.display = 'flex';
        }

        // --- ADD CATEGORY ---
        addNewCategoryBtn.addEventListener('click', async () => {
            const newName = newCategoryNameInput.value.trim();
            const newType = document.getElementById('new-category-type').value; 
            if (!newName) return showCategoryMessage('Please enter a category name.', 'error');
            try {
                const formData = new FormData();
                formData.append('CategoryName', newName);
                formData.append('ItemType', newType); 
                const response = await fetch(`${API_URL}?action=add_category`, { method: 'POST', body: formData });
                const result = await response.json();
                if (result.success) { 
                    newCategoryNameInput.value = ''; 
                    await loadCategories(); 
                    await refreshCategoryDropdowns(); 
                } else showCategoryMessage(result.message, 'error');
            } catch (e) { showCategoryMessage('Error adding category.', 'error'); }
        });

        // --- UPDATE CATEGORY ---
        editCategoryNameForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const categoryId = editCategoryIdInput.value;
            const newName = editCategoryNameInput.value.trim();
            const newType = document.getElementById('edit-category-type-input').value; 
            try {
                const formData = new FormData();
                formData.append('CategoryID', categoryId);
                formData.append('CategoryName', newName);
                formData.append('ItemType', newType); 
                const response = await fetch(`${API_URL}?action=update_category`, { method: 'POST', body: formData });
                const result = await response.json();
                if (result.success) { 
                    closeEditCategoryNameModal(); 
                    await loadCategories(); 
                    await refreshCategoryDropdowns(); 
                } else showCategoryMessage(result.message, 'error');
            } catch (e) { console.error(e); }
        });

        // --- DELEGATE CLICKS (Edit/Archive/Restore) ---
        categoryListContainer.addEventListener('click', (e) => {
            const item = e.target.closest('.category-list-item');
            if (!item) return; 
            
            const categoryId = item.dataset.id;
            const categoryName = item.querySelector('.category-name').textContent;
            
            const editBtn = e.target.closest('.btn-edit-category');
            const archiveBtn = e.target.closest('.btn-archive-category');
            const restoreBtn = e.target.closest('.btn-restore-category');

            if (editBtn) openEditCategoryNameModal(categoryId, categoryName, item.dataset.type);
            if (archiveBtn) showCategoryArchiveModal(categoryId, categoryName);
            if (restoreBtn) restoreCategory(categoryId);
        });

        // --- ARCHIVE CATEGORY ---
        catDelConfirmBtn.addEventListener('click', async () => {
            if (!categoryIdToArchive) return;
            try {
                const formData = new FormData();
                formData.append('CategoryID', categoryIdToArchive);
                const response = await fetch(`${API_URL}?action=archive_category`, { method: 'POST', body: formData });
                const result = await response.json();
                closeCategoryArchiveModal();
                if (result.success) {
                    await loadCategories();
                    await refreshCategoryDropdowns();
                    showCategoryMessage('Category archived successfully.', 'success');
                } else showCategoryMessage(result.message || 'Failed to archive.', 'error');
            } catch (error) {
                closeCategoryArchiveModal();
                showCategoryMessage('An error occurred.', 'error');
            }
        });

        // --- RESTORE CATEGORY ---
        async function restoreCategory(id) {
            try {
                const formData = new FormData();
                formData.append('CategoryID', id);
                const response = await fetch(`${API_URL}?action=restore_category`, { method: 'POST', body: formData });
                const result = await response.json();
                if (result.success) {
                    await loadCategories();
                    await refreshCategoryDropdowns();
                    showCategoryMessage('Category restored successfully.', 'success');
                } else showCategoryMessage(result.message || 'Failed to restore.', 'error');
            } catch (error) { showCategoryMessage('An error occurred.', 'error'); }
        }
    });
</script>

<script>
// --- FORM TOGGLES (Including Category Auto-Filter) ---
function toggleAddExpiration() {
    const type = document.getElementById('item-type').value;
    const expGroup = document.getElementById('expiration-group');
    const expInput = document.getElementById('item-expiration');
    if (type === 'Consumables') { expGroup.style.display = 'block'; expInput.required = true; } 
    else { expGroup.style.display = 'none'; expInput.required = false; expInput.value = ''; }
    
    // Auto-filter categories
    if(window.filterCategoriesByType) window.filterCategoriesByType('item-type', 'item-category');
}

function toggleEditExpiration() {
    const type = document.getElementById('edit-item-type').value;
    const expGroup = document.getElementById('edit-expiration-group');
    const expInput = document.getElementById('edit-item-expiration');
    if (type === 'Consumables') { expGroup.style.display = 'block'; expInput.required = true; } 
    else { expGroup.style.display = 'none'; expInput.required = false; expInput.value = ''; }
    
    // Auto-filter categories
    if(window.filterCategoriesByType) window.filterCategoriesByType('edit-item-type', 'edit-item-category');
}
</script>
<script src="script/download-utils.js?v=<?php echo time(); ?>"></script>
</body>
</html>
