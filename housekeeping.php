<?php
// 1. Start the session with the same secure settings

// 2. Cache Control Headers
header('Cache-Control: no-cache, no-store, must-revalidate'); // HTTP 1.1.
header('Pragma: no-cache'); // HTTP 1.0.
header('Expires: 0'); // Proxies.

// 3. Check Login Status and Role (ONLY manager allowed)
include('check_session.php');
require_login(['housekeeping_manager']); // *** MODIFIED: Only allow manager ***

// ======================================================
// === PHP Logic Orchestration (REQUIRED FILES) ===
// ======================================================

// 1. Load the database configuration and connection ($conn is now available)
require_once('db_connection.php');

// 2. Load the user data function to get current user info for header
require_once('User.php');
$userData = getUserData($conn);
$Fname = htmlspecialchars($userData['Name']);
$Accounttype = htmlspecialchars($userData['Accounttype']);

// 3. Fetch Rooms that need cleaning
$roomsNeedingCleaning = [];
$sql_rooms = "SELECT RoomID, FloorNumber, RoomNumber, LastClean
              FROM room
              WHERE RoomStatus = 'Needs Cleaning'
              ORDER BY FloorNumber, RoomNumber ASC";
if ($result_rooms = $conn->query($sql_rooms)) {
    while ($row = $result_rooms->fetch_assoc()) {
        $roomsNeedingCleaning[] = [
            'id' => $row['RoomID'],
            'floor' => $row['FloorNumber'],
            'room' => $row['RoomNumber'],
            'lastCleaned' => $row['LastClean'] ? date('Y-m-d g:i A', strtotime($row['LastClean'])) : 'Never',
            'date' => date('Y-m-d'),
            'requestTime' => date('g:i A'),
            'status' => 'needs-cleaning',
            'staff' => 'Not Assigned'
        ];
    }
    $result_rooms->free();
} else {
    error_log("Error fetching rooms needing cleaning: " . $conn->error);
}

// 4. Fetch Housekeeping Staff
$housekeepingStaff = [];
$sql_staff = "SELECT UserID, Fname, Lname, Mname FROM users WHERE AccountType = 'housekeeping_staff'";
if ($result_staff = $conn->query($sql_staff)) {
    while ($row = $result_staff->fetch_assoc()) {
        $staffName = trim(
            htmlspecialchars($row['Fname']) .
            (empty($row['Mname']) ? '' : ' ' . strtoupper(substr(htmlspecialchars($row['Mname']), 0, 1)) . '.') .
            ' ' .
            htmlspecialchars($row['Lname'])
        );
        $housekeepingStaff[] = [
            'id' => $row['UserID'],
            'name' => $staffName,
            'assigned' => false
        ];
    }
    $result_staff->free();
} else {
    error_log("Error fetching housekeeping staff: " . $conn->error);
}

// 5. Fetch Linens & Amenities Types (Sample Data)
$linensTypes = ['Bed Sheets', 'Towels', 'Pillowcases', 'Blankets', 'Bathrobes'];
$amenitiesTypes = ['Toiletries', 'Mini Bar', 'Coffee/Tea', 'Slippers', 'Dental Kit'];

// 6. Fetch Linens & Amenities Items (Sample Data)
$linensAmenitiesItems = [
    [
        'id' => 1,
        'roomId' => 1,
        'floor' => 1,
        'room' => 101,
        'type' => 'Bed Sheets',
        'item' => 'Queen Size Bed Sheets',
        'category' => 'linens',
        'lastCleaned' => '2024-11-01 10:00 AM',
        'remarks' => 'Good condition'
    ],
    [
        'id' => 2,
        'roomId' => 1,
        'floor' => 1,
        'room' => 101,
        'type' => 'Towels',
        'item' => 'Bath Towels (2pcs)',
        'category' => 'linens',
        'lastCleaned' => '2024-10-28 2:30 PM',
        'remarks' => 'Recently replaced'
    ],
    [
        'id' => 3,
        'roomId' => 1,
        'floor' => 1,
        'room' => 101,
        'type' => 'Toiletries',
        'item' => 'Shampoo & Conditioner',
        'category' => 'amenities',
        'lastCleaned' => '2024-11-01 10:00 AM',
        'remarks' => 'Refilled'
    ],
    [
        'id' => 4,
        'roomId' => 2,
        'floor' => 2,
        'room' => 201,
        'type' => 'Bed Sheets',
        'item' => 'King Size Bed Sheets',
        'category' => 'linens',
        'lastCleaned' => '2024-10-30 9:00 AM',
        'remarks' => 'Good condition'
    ],
    [
        'id' => 5,
        'roomId' => 2,
        'floor' => 2,
        'room' => 201,
        'type' => 'Mini Bar',
        'item' => 'Beverages & Snacks',
        'category' => 'amenities',
        'lastCleaned' => '2024-11-01 11:30 AM',
        'remarks' => 'Restocked'
    ],
    [
        'id' => 6,
        'roomId' => 3,
        'floor' => 2,
        'room' => 202,
        'type' => 'Bathrobes',
        'item' => 'Cotton Bathrobes (2pcs)',
        'category' => 'linens',
        'lastCleaned' => '2024-10-29 3:15 PM',
        'remarks' => 'Clean'
    ]
];

// 7. Fetch all rooms for dropdowns
$allRooms = [];
$sql_all_rooms = "SELECT RoomID, FloorNumber, RoomNumber FROM room ORDER BY FloorNumber, RoomNumber";
if ($result_all_rooms = $conn->query($sql_all_rooms)) {
    while ($row = $result_all_rooms->fetch_assoc()) {
        $allRooms[] = [
            'id' => $row['RoomID'],
            'floor' => $row['FloorNumber'],
            'room' => $row['RoomNumber']
        ];
    }
    $result_all_rooms->free();
}

// 8. Close the DB connection
$conn->close();

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Celestia Hotel - Housekeeping Management</title>
  <link rel="stylesheet" href="css/housekeeping.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
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
        <h3><?php echo $Fname; ?></h3>
        <p><?php echo ucfirst($Accounttype); ?></p>
      </div>

      <nav class="profile-nav">
        <a href="#" id="account-details-link">
          <i class="fas fa-user-edit" style="margin-right: 10px;"></i> Account Details
        </a>
      </nav>

      <div class="profile-footer">
        <a href="#" id="logoutBtn">
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
    <h1 class="pageTitle">HOUSEKEEPING</h1>
    <div class="tabNavigation">
      <button class="tabBtn active" data-tab="requests">
        <img src="assets/icons/requests-icon.png" alt="Requests" class="tabIcon" />
        Requests
      </button>
      <button class="tabBtn" data-tab="history">
        <img src="assets/icons/history-icon.png" alt="History" class="tabIcon" />
        History
      </button>
      <button class="tabBtn" data-tab="linens">
        <img src="assets/icons/linens.png" alt="Linens" class="tabIcon" />
        Linens & Amenities
      </button>
    </div>

    <!-- REQUESTS TAB -->
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
          </select>

          <div class="searchBox">
            <input type="text" placeholder="Search Room Number..." class="searchInput" id="searchInput" />
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
              <th>Floor</th>
              <th>Room</th>
              <th>Date</th>
              <th>Request Time</th>
              <th>Last Cleaned</th>
              <th>Status</th>
              <th>Staff In Charge</th>
            </tr>
          </thead>
          <tbody id="requestsTableBody">
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <span class="paginationInfo">Display Records <span id="requestsRecordCount">0</span></span>
        <div class="paginationControls" id="requestsPaginationControls">
        </div>
      </div>
    </div>

    <!-- HISTORY TAB -->
    <div class="tabContent" id="history-tab">
      <div class="controlsRow">
        <div class="filterControls">
          <select class="filterDropdown" id="floorFilterHistory">
            <option value="">Floor</option>
          </select>
          <select class="filterDropdown" id="roomFilterHistory">
            <option value="">Room</option>
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
          <button class="refreshBtn" id="historyRefreshBtn">
            <img src="assets/icons/refresh-icon.png" alt="Refresh" />
          </button>
          <button class="downloadBtn" id="historyDownloadBtn">
            <img src="assets/icons/download-icon.png" alt="Download" />
          </button>
        </div>
      </div>

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
            <tr><td colspan="9" style="text-align: center; padding: 40px; color: #999;">History data not implemented yet.</td></tr>
          </tbody>
        </table>

        <div class="pagination">
          <span class="paginationInfo">Display Records <span id="historyRecordCount">0</span></span>
          <div class="paginationControls" id="historyPaginationControls">
          </div>
        </div>
      </div>
    </div>

  <!-- LINENS & AMENITIES TAB -->
    <div class="tabContent" id="linens-tab">
      <div class="linensSubTabs">
        <button class="subTabBtn active" data-subtab="linens">
          LINENS
        </button>
        <button class="subTabBtn" data-subtab="amenities">
          AMENITIES
        </button>
      </div>

      <div class="controlsRow">
        <div class="filterControls">
          <select class="filterDropdown" id="floorFilterLinens">
            <option value="">Floor</option>
          </select>
          <select class="filterDropdown" id="roomFilterLinens">
            <option value="">Room</option>
          </select>
          <select class="filterDropdown" id="statusFilterLinens">
            <option value="">Status</option>
          </select>
          <div class="searchBox">
            <input type="text" placeholder="Search" class="searchInput" id="linensSearchInput" />
            <button class="searchBtn">
              <img src="assets/icons/search-icon.png" alt="Search" />
            </button>
          </div>
          <button class="refreshBtn" id="linensRefreshBtn">
            <img src="assets/icons/refresh-icon.png" alt="Refresh" />
          </button>
          <button class="downloadBtn" id="linensDownloadBtn">
            <img src="assets/icons/download-icon.png" alt="Download" />
          </button>
          <button class="addItemBtnInline" id="addItemBtn">
            <img src="assets/icons/add.png" alt="Add" />
          </button>
        </div>
      </div>

      <div class="tableWrapper">
        <table class="linensTable">
          <thead>
            <tr>
              <th>FLOOR</th>
              <th>ROOM</th>
              <th>TYPES</th>
              <th>ITEMS</th>
              <th>TIME/DATE</th>
              <th>STATUS</th>
              <th>REMARKS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody id="linensTableBody">
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <span class="paginationInfo">Display Records <span id="linensRecordCount">0</span></span>
        <div class="paginationControls" id="linensPaginationControls">
        </div>
      </div>
    </div>
  </div>

  <!-- Staff Selection Modal -->
  <div class="modalBackdrop" id="staffModal" style="display: none;">
    <div class="staffSelectionModal">
      <button class="closeBtn" id="closeStaffModalBtn">×</button>
      <h2>SELECT STAFF MEMBER</h2>
      <p class="modalSubtext">Showing available Housekeeping Staff</p>
      <div class="searchBox modalSearchBox">
        <input type="text" placeholder="Search staff..." class="searchInput" id="staffModalSearchInput" />
        <button class="searchBtn">
          <img src="assets/icons/search-icon.png" alt="Search" />
        </button>
      </div>

      <div class="staffList" id="staffList">
      </div>

      <div class="modalButtons">
        <button class="modalBtn cancelBtn" id="cancelStaffBtn">CLOSE</button>
      </div>
    </div>
  </div>

  <!-- Add/Edit Item Modal -->
  <div class="modalBackdrop" id="addItemModal" style="display: none;">
    <div class="addItemModal">
      <button class="closeBtn" id="closeAddItemBtn">×</button>
      <div class="modalIconHeader">
        <i class="fas fa-broom" style="font-size: 48px; color: #FFA237;"></i>
      </div>
      <h2 id="addItemModalTitle">Add Item</h2>
      <p class="modalSubtext">Please fill out the item details carefully before submitting. Ensure that all information is accurate to help track usage, replacements, and maintain proper housekeeping records.</p>
      
      <form id="addItemForm">
        <input type="hidden" id="itemId" value="">
        <div class="formRow">
          <div class="formGroup">
            <label>Floor</label>
            <select class="formInput" id="itemFloor" required>
              <option value="">Select Floor</option>
            </select>
          </div>
          <div class="formGroup">
            <label>Room</label>
            <select class="formInput" id="itemRoom" required>
              <option value="">Select Room</option>
            </select>
          </div>
        </div>
        <div class="formRow">
          <div class="formGroup">
            <label>Item</label>
            <input type="text" class="formInput" id="itemName" placeholder="Enter item name" required>
          </div>
        </div>
        <div class="formRow">
          <div class="formGroup">
            <label>Type</label>
            <input type="text" class="formInput" id="itemType" placeholder="Enter type" required>
          </div>
          <div class="formGroup">
            <label>Last Replaced</label>
            <input type="date" class="formInput" id="itemLastReplaced">
          </div>
        </div>

        <div class="modalButtons">
          <button type="button" class="modalBtn cancelBtn" id="cancelAddItemBtn">CANCEL</button>
          <button type="submit" class="modalBtn confirmBtn" id="submitItemBtn">ADD ITEM</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Confirmation Modal -->
  <div class="modalBackdrop" id="confirmModal" style="display: none;">
    <div class="confirmModal">
      <h2 id="confirmModalTitle">Are you sure you want to add this item?</h2>
      <p class="modalSubtext" id="confirmModalText">Please review the details before confirming. Once added, the item will be recorded and visible in the maintenance records.</p>
      <div class="modalButtons">
        <button class="modalBtn cancelBtn" id="cancelConfirmBtn">CANCEL</button>
        <button class="modalBtn confirmBtn" id="confirmActionBtn">YES, ADD ITEM</button>
      </div>
    </div>
  </div>

  <!-- Success Modal -->
  <div class="modalBackdrop" id="successModal" style="display: none;">
    <div class="successModal">
      <button class="closeBtn" id="closeSuccessBtn">×</button>
      <div class="modalIconHeader">
        <i class="fas fa-check-circle" style="font-size: 80px; color: #28a745;"></i>
      </div>
      <h2 id="successModalMessage">Item Added Successfully</h2>
      <div class="modalButtons">
        <button class="modalBtn okayBtn" id="okaySuccessBtn">OKAY</button>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <div class="modalBackdrop" id="deleteModal" style="display: none;">
    <div class="confirmModal deleteConfirmModal">
      <button class="closeBtn" id="closeDeleteBtn">×</button>
      <div class="modalIconHeader">
        <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: #FFA237;"></i>
      </div>
      <h2>Are you sure you want to delete this item from the room's housekeeping list?</h2>
      <p class="modalSubtext">This action cannot be undone, and all related records will be permanently removed.</p>
      <div class="modalButtons">
        <button class="modalBtn cancelBtn" id="cancelDeleteBtn">CANCEL</button>
        <button class="modalBtn confirmBtn deleteBtn" id="confirmDeleteBtn">YES, DELETE</button>
      </div>
    </div>
  </div>

  <script>
    // Make PHP data available to the JS file
    const initialRequestsData = <?php echo json_encode($roomsNeedingCleaning); ?>;
    const availableStaffData = <?php echo json_encode($housekeepingStaff); ?>;
    const initialLinensAmenitiesData = <?php echo json_encode($linensAmenitiesItems); ?>;
    const allRoomsData = <?php echo json_encode($allRooms); ?>;
    const linensTypesData = <?php echo json_encode($linensTypes); ?>;
    const amenitiesTypesData = <?php echo json_encode($amenitiesTypes); ?>;
  </script>

  <script src="script/housekeeping.js"></script>
</body>
</html>