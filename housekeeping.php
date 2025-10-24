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
  <!-- Logout Confirmation Modal -->
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

  <!-- Main Container -->
  <div class="mainContainer">
    <!-- Page Title -->
    <h1 class="pageTitle">HOUSEKEEPING</h1>

    <!-- Tab Navigation -->
    <div class="tabNavigation">
      <button class="tabBtn active" data-tab="requests">
        <img src="assets/icons/requests-icon.png" alt="Requests" class="tabIcon" />
        Requests
      </button>
      <button class="tabBtn" data-tab="history">
        <img src="assets/icons/history-icon.png" alt="History" class="tabIcon" />
        History
      </button>
    </div>

    <!-- ===== REQUESTS TAB ===== -->
    <div class="tabContent active" id="requests-tab">
      <div class="controlsRow">
        <div class="filterControls">
          <select class="filterDropdown" id="floorFilter">
            <option value="">Floor</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>

          <select class="filterDropdown" id="roomFilter">
            <option value="">Room</option>
            <option value="101">101</option>
            <option value="102">102</option>
          </select>

          <select class="filterDropdown" id="statusFilter">
            <option value="">Status</option>
            <option value="dirty">Dirty / Unoccupied</option>
            <option value="request">Request Clean / Occupied</option>
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

      <!-- Requests Table -->
      <div class="tableWrapper">
        <table class="requestsTable">
          <thead>
            <tr>
              <th>Floor</th>
              <th>Room</th>
              <th>Guest</th>
              <th>Date</th>
              <th>Request Time</th>
              <th>Last Cleaned</th>
              <th>Status</th>
              <th>Staff In Charge</th>
            </tr>
          </thead>
          <tbody id="requestsTableBody">
            <!-- Data will be populated here -->
          </tbody>
        </table>
      </div>
    </div>

    <!-- ===== HISTORY TAB ===== -->
    <div class="tabContent" id="history-tab">
      <div class="controlsRow">
        <div class="filterControls">
          <select class="filterDropdown" id="floorFilterHistory">
            <option value="">Floor</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>

          <select class="filterDropdown" id="roomFilterHistory">
            <option value="">Room</option>
            <option value="101">101</option>
            <option value="102">102</option>
          </select>

          <select class="filterDropdown" id="dateFilterHistory">
            <option value="">Calendar</option>
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

      <!-- History Table -->
      <div class="tableWrapper">
        <table class="historyTable">
          <thead>
            <tr>
              <th>Floor</th>
              <th>Room</th>
              <th>Guest</th>
              <th>Date</th>
              <th>Requested Time</th>
              <th>Completed Time</th>
              <th>Staff In Charge</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody id="historyTableBody">
            <!-- Data will be populated here -->
          </tbody>
        </table>

        <!-- Pagination -->
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

  <!-- Staff Selection Modal -->
  <div class="modalBackdrop" id="staffModal" style="display: none;">
    <div class="staffSelectionModal">
      <button class="closeBtn" id="closeStaffModalBtn">×</button>
      <h2>SELECT STAFF MEMBER</h2>
      <p class="modalSubtext">Choose a staff member to assign to this cleaning request</p>
      
      <!-- Search Box -->
      <div class="searchBox modalSearchBox">
        <input type="text" placeholder="Search staff..." class="searchInput" id="staffModalSearchInput" />
        <button class="searchBtn">
          <img src="assets/icons/search-icon.png" alt="Search" />
        </button>
      </div>

      <!-- Staff List -->
      <div class="staffList" id="staffList">
        <!-- Staff members will be populated here -->
      </div>

      <div class="modalButtons">
        <button class="modalBtn cancelBtn" id="cancelStaffBtn">CANCEL</button>
        <button class="modalBtn confirmBtn" id="confirmStaffBtn" disabled>ASSIGN STAFF</button>
      </div>
    </div>
  </div>

  <!-- Confirmation Modal -->
  <div class="modalBackdrop" id="assignModal" style="display: none;">
    <div class="assignModal">
      <button class="closeBtn" id="closeAssignBtn">×</button>

      <h2>Are you sure you want to assign this staff?</h2>
      <p>Once confirmed, this request will be officially assigned to the selected staff member. A notification email will also be sent to their registered email address.</p>
      <p class="noteText">Please note that once the assignment is confirmed, it cannot be edited or changed.</p>
      <div class="modalButtons">
        <button class="modalBtn cancelBtn" id="cancelAssignBtn">CANCEL</button>
        <button class="modalBtn confirmBtn" id="confirmAssignBtn">YES, ASSIGN STAFF</button>
      </div>
    </div>
  </div>

  <!-- Success Modal -->
  <div class="modalBackdrop" id="successModal" style="display: none;">
    <div class="successModal">
      <button class="closeBtn" id="closeSuccessBtn">×</button>
      <div class="successIcon">
        <img src="assets/icons/successful-icon.png" alt="Success" class="icon-btn" style="width: 50px ; height: 50px;"/>
      </div>
      <h2>Staff Assigned Successfully</h2>
      <div class="modalButtons">
        <button class="modalBtn okayBtn" id="okayBtn">OKAY</button>
      </div>
    </div>
  </div>
  <!-- Load Shared Data First -->
  <script src="script/shared-data.js"></script>
  <!-- Then Load Page-Specific Script -->
  <script src="script/housekeeping.js"></script>
</body>
</html>