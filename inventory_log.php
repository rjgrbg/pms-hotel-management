<?php
// Include the session check and login requirement logic
include('check_session.php');

// *** MODIFIED: Only allow staff to access this page ***
require_login(['housekeeping_staff', 'maintenance_staff']); 

// --- Fetch User Data from Database (Copied from inventory.php) ---
include('db_connection.php'); // Ensure DB connection is included
header('Cache-Control: no-cache, no-store, must-revalidate'); 
header('Pragma: no-cache');
header('Expires: 0');
$formattedName = 'Staff'; // Default name
$Accounttype = 'Staff'; // Default type
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
                $Lname = htmlspecialchars($user['Lname'] ?? 'Staff');
                $Fname = htmlspecialchars($user['Fname'] ?? '');
                $Mname = htmlspecialchars($user['Mname'] ?? '');
                $Accounttype = htmlspecialchars($user['AccountType'] ?? 'Staff'); // Fetch AccountType as well

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
                    $formattedName = 'Staff'; // Fallback to default
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
     error_log("UserID not found in session for inventory_log.php");
}
// --- End Fetch User Data ---

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Celestia Hotel - Inventory Log</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <link rel="stylesheet" href="css/inventory_log_page.css?v=1.3">
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
    
    <div class="main-container">
        <h1 class="page-title">Inventory Log</h1>
        
        <div class="inventory-log-container">
            
            <div class="table-section">
                <div class="controls-row">
                    <div class="filter-controls">
                        <select class="filter-dropdown" id="categoryFilter">
                            <option value="">All Categories</option>
                            </select>
                        <div class="search-box">
                            <input type="text" placeholder="Search Item Name..." class="search-input" id="searchInput">
                            <i class="fas fa-search search-icon"></i>
                        </div>
                    </div>
                </div>

                <div class="table-container">
                    <table class="inventory-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="inventoryTableBody">
                            </tbody>
                    </table>
                </div>
            </div>

            <div class="item-details-section">
                <h2 class="details-title">Issue Items</h2>
                <div class="item-details-content" id="itemDetailsContent">
                    <p class="placeholder-text">Select an item from the table to get started.</p>
                    </div>
                <div class="details-actions">
                    <button class="action-btn-outline" id="cancelBtn">CANCEL</button>
                    <button class="action-btn-confirm" id="doneBtn" disabled>DONE</button>
                </div>
            </div>

        </div>
    </div>
    
    <div class="message-box-backdrop" id="messageBoxBackdrop">
        <div class="message-box-content">
            <h2 id="messageBoxTitle">Success</h2>
            <pre id="messageBoxText">Items issued successfully.</pre>
            <button class="action-btn-confirm" id="messageBoxClose">OK</button>
        </div>
    </div>

    <div class="confirmation-modal-backdrop" id="confirmationModalBackdrop">
        <div class="confirmation-modal-content">
            <div class="confirmation-modal-header">
                ITEM DETAILS
            </div>
            <div class="confirmation-modal-body" id="confirmationModalBody">
                </div>
            <div class="confirmation-modal-actions">
                <button class="action-btn-outline" id="cancelConfirmBtn">CANCEL</button>
                <button class="action-btn-confirm" id="confirmBtn">CONFIRM</button>
            </div>
        </div>
    </div>
    
    <script src="script/shared-data.js"></script>
    <script src="script/inventory_log.js?v=1.3"></script>

</body>
</html>