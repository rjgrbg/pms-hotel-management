<?php
// Include the session check and login requirement logic
include('check_session.php');

// Only allow users with the 'admin' AccountType
require_login(['admin']);

// --- Fetch User Data from Database ---
include('db_connection.php'); // Ensure DB connection is included

$formattedName = 'Admin'; // Default name
$Accounttype = 'Administrator'; // Default type

if (isset($_SESSION['UserID'])) {
    $userId = $_SESSION['UserID'];
    $sql = "SELECT Fname, Mname, Lname, AccountType FROM users WHERE UserID = ?";
    
    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("i", $userId);
        if ($stmt->execute()) {
            $result = $stmt->get_result();
            if ($user = $result->fetch_assoc()) {
                // Fetch names and sanitize for display
                $Lname = htmlspecialchars($user['Lname'] ?? 'Admin');
                $Fname = htmlspecialchars($user['Fname'] ?? '');
                $Mname = htmlspecialchars($user['Mname'] ?? '');
                $Accounttype = htmlspecialchars($user['AccountType'] ?? 'Administrator'); // Fetch AccountType as well

                // Format the name: Lname, Fname M.
                $formattedName = $Lname;
                if (!empty($Fname)) {
                    $formattedName .= ', ' . $Fname;
                    if (!empty($Mname)) {
                        // Add middle initial with a period if Mname exists
                        $formattedName .= ' ' . strtoupper(substr($Mname, 0, 1)) . '.';
                    }
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
  <title>The Celestia Hotel - Admin Dashboard</title>
  <link rel="stylesheet" href="css/admin.css">
</head>
<body>
  <header class="header">
    <div class="headerLeft">
      <img src="assets/images/celestia-logo.png" alt="Logo" class="headerLogo" />
      <span class="hotelName">THE CELESTIA HOTEL</span>
    </div>
  </header>

  <div class="mainWrapper">
    <aside class="sidebar">
      <div class="sidebarContent">
        <div class="profileSection">
          <div class="profileAvatar">
            <img src="assets/icons/profile-icon.png" alt="Profile" />
          </div>
          <h3 class="profileName"><?php echo $formattedName; // Use the name fetched from DB ?></h3>
          <p class="profileRole"><?php echo ucfirst($Accounttype); // Use AccountType fetched from DB ?></p>
        </div>

        <nav class="sidebarNav">
          <ul class="navList">
            <li>
              <a href="#dashboard" class="navLink active" data-page="dashboard">
                <img src="assets/icons/dashboard-icon.png" alt="Dashboard" class="navIcon" />
                Dashboard
              </a>
            </li>
            <li>
              <a href="#housekeeping" class="navLink" data-page="housekeeping">
                <img src="assets/icons/cleaning-icon.png" alt="Housekeeping" class="navIcon" />
                Housekeeping
              </a>
            </li>
            <li>
              <a href="#maintenance" class="navLink" data-page="maintenance">
                <img src="assets/icons/maintenance-icon.png" alt="Maintenance" class="navIcon" />
                Maintenance
              </a>
            </li>
            <li>
              <a href="#parking" class="navLink" data-page="parking">
                <img src="assets/icons/parking-icon.png" alt="Parking" class="navIcon" />
                Parking
              </a>
            </li>
            <li>
              <a href="#inventory" class="navLink" data-page="inventory">
                <img src="assets/icons/inventory-icon.png" alt="Inventory" class="navIcon" />
                Inventory
              </a>
            </li>
            <li>
              <a href="#rooms" class="navLink" data-page="rooms">
                <img src="assets/icons/rooms-icon.png" alt="Rooms" class="navIcon" />
                Rooms
              </a>
            </li>
            <li>
              <a href="#manage-users" class="navLink" data-page="manage-users">
                <img src="assets/icons/users-icon.png" alt="Manage Users" class="navIcon" />
                Manage Users
              </a>
            </li>
          </ul>
        </nav>

        <button class="logoutBtn" id="logoutBtn">Logout</button>
      </div>
    </aside>

    <main class="mainContent">
      <div class="page active" id="dashboard-page">
        <h1 class="pageTitle">ADMIN DASHBOARD</h1>

        <section class="dashboardSection">
          <h2 class="sectionTitle">Housekeeping and Maintenance</h2>
          <div class="statsGrid">
            <div class="statCard">
              <h3 class="statLabel">Total Rooms</h3>
              <p class="statValue">40</p>
            </div>
            <div class="statCard">
              <h3 class="statLabel">Occupied</h3>
              <p class="statValue">15</p>
            </div>
            <div class="statCard">
              <h3 class="statLabel">Needs Cleaning</h3>
              <p class="statValue">0</p>
            </div>
            <div class="statCard">
              <h3 class="statLabel">Maintenance Requests</h3>
              <p class="statValue">0</p>
            </div>
          </div>
        </section>

        <section class="dashboardSection">
          <h2 class="sectionTitle">Inventory</h2>
          <div class="statsGrid">
            <div class="statCard">
              <h3 class="statLabel">Total Items</h3>
              <p class="statValue">40</p>
            </div>
            <div class="statCard">
              <h3 class="statLabel">Low Stock</h3>
              <p class="statValue">15</p>
            </div>
            <div class="statCard">
              <h3 class="statLabel">Out of Stock</h3>
              <p class="statValue">15</p>
            </div>
          </div>
        </section>

        <section class="dashboardSection">
          <h2 class="sectionTitle">Parking</h2>
          <div class="statsGrid">
            <div class="statCard">
              <h3 class="statLabel">Total Slots</h3>
              <p class="statValue">40</p>
            </div>
            <div class="statCard">
              <h3 class="statLabel">Occupied</h3>
              <p class="statValue">15</p>
            </div>
            <div class="statCard">
              <h3 class="statLabel">Vacant</h3>
              <p class="statValue">15</p>
            </div>
            <div class="statCard">
              <h3 class="statLabel">Reserved</h3>
              <p class="statValue">15</p>
            </div>
          </div>
        </section>

        <section class="dashboardSection">
          <h2 class="sectionTitle">Users</h2>
          <div class="statsGrid">
            <div class="statCard">
              <h3 class="statLabel">Total Employees</h3>
              <p class="statValue">40</p>
              <p class="statSubtext"></p>
            </div>
            <div class="statCard">
              <h3 class="statLabel">Housekeeping</h3>
              <p class="statValue">10</p>
            </div>
            <div class="statCard">
              <h3 class="statLabel">Maintenance</h3>
              <p class="statValue">8</p>
            </div>
            <div class="statCard">
              <h3 class="statLabel">Parking</h3>
              <p class="statValue">5</p>
            </div>
          </div>
        </section>
      </div>

      <div class="page" id="housekeeping-page">
        <h1 class="pageTitle">HOUSEKEEPING</h1>

        <div class="tabNavigation">
          <button class="tabBtn active" data-admin-tab="hk-requests">
            Requests
          </button>
          <button class="tabBtn" data-admin-tab="hk-history">
            History
          </button>
        </div>

        <div class="tabContent active" id="hk-requests-tab">
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
                <input type="text" placeholder="Search" class="searchInput" id="hkSearchInput" />
                <button class="searchBtn">
                  <img src="assets/icons/search-icon.png" alt="Search" />
                </button>
              </div>
              <button class="refreshBtn" id="hkRefreshBtn">
                <img src="assets/icons/refresh-icon.png" alt="Refresh" />
              </button>
              <button class="downloadBtn" id="hkDownloadBtn">
                <img src="assets/icons/download-icon.png" alt="Download" />
              </button>
            </div>
          </div>

          <div class="tableWrapper">
            <table>
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
              <tbody id="hkTableBody">
              </tbody>
            </table>
          </div>

          <div class="pagination">
            <span class="paginationInfo">Display Records <span id="hkRecordCount">0</span></span>
            <div class="paginationControls">
              <button class="paginationBtn"><</button>
              <button class="paginationBtn active">1</button>
              <button class="paginationBtn">2</button>
              <button class="paginationBtn">3</button>
              <button class="paginationBtn">4</button>
              <button class="paginationBtn">5</button>
              <span class="paginationDots">...</span>
              <button class="paginationBtn">10</button>
              <button class="paginationBtn">></button>
            </div>
          </div>
        </div>

        <div class="tabContent" id="hk-history-tab">
          <div class="controlsRow">
            <div class="filterControls">
              <select class="filterDropdown" id="floorFilterHkHist">
                <option value="">Floor</option>
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
              <select class="filterDropdown" id="roomFilterHkHist">
                <option value="">Room</option>
                <option value="101">101</option>
                <option value="102">102</option>
              </select>
              <div class="searchBox">
                <input type="text" placeholder="Search" class="searchInput" id="hkHistSearchInput" />
                <button class="searchBtn">
                  <img src="assets/icons/search-icon.png" alt="Search" />
                </button>
              </div>
              <button class="refreshBtn" id="hkHistRefreshBtn">
                <img src="assets/icons/refresh-icon.png" alt="Refresh" />
              </button>
              <button class="downloadBtn" id="hkHistDownloadBtn">
                <img src="assets/icons/download-icon.png" alt="Download" />
              </button>
            </div>
          </div>

          <div class="tableWrapper">
            <table>
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
              <tbody id="hkHistTableBody">
              </tbody>
            </table>
          </div>

          <div class="pagination">
            <span class="paginationInfo">Display Records <span id="hkHistRecordCount">0</span></span>
            <div class="paginationControls">
              <button class="paginationBtn"><</button>
              <button class="paginationBtn active">1</button>
              <button class="paginationBtn">2</button>
              <button class="paginationBtn">3</button>
              <button class="paginationBtn">4</button>
              <button class="paginationBtn">5</button>
              <span class="paginationDots">...</span>
              <button class="paginationBtn">10</button>
              <button class="paginationBtn">></button>
            </div>
          </div>
        </div>
      </div>

      <div class="page" id="maintenance-page">
        <h1 class="pageTitle">MAINTENANCE</h1>

        <div class="controlsRow">
          <div class="filterControls">
            <select class="filterDropdown" id="mtFloorFilter">
              <option value="">Floor</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
            <select class="filterDropdown" id="mtRoomFilter">
              <option value="">Room</option>
              <option value="101">101</option>
              <option value="102">102</option>
            </select>
            <select class="filterDropdown" id="mtStatusFilter">
              <option value="">Status</option>
              <option value="repaired">Repaired</option>
              <option value="pending">Pending</option>
            </select>
            <div class="searchBox">
              <input type="text" placeholder="Search" class="searchInput" id="mtSearchInput" />
              <button class="searchBtn">
                <img src="assets/icons/search-icon.png" alt="Search" />
              </button>
            </div>
            <button class="refreshBtn" id="mtRefreshBtn">
              <img src="assets/icons/refresh-icon.png" alt="Refresh" />
            </button>
            <button class="downloadBtn" id="mtDownloadBtn">
              <img src="assets/icons/download-icon.png" alt="Download" />
            </button>
          </div>
        </div>

        <div class="tableWrapper">
          <table>
            <thead>
              <tr>
                <th>Floor</th>
                <th>Room</th>
                <th>Issue Type</th>
                <th>Date</th>
                <th>Requested Time</th>
                <th>Completed Time</th>
                <th>Status</th>
                <th>Staff In Charge</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody id="mtTableBody">
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <span class="paginationInfo">Display Records <span id="mtRecordCount">0</span></span>
          <div class="paginationControls">
            <button class="paginationBtn"><</button>
            <button class="paginationBtn active">1</button>
            <button class="paginationBtn">2</button>
            <button class="paginationBtn">3</button>
            <button class="paginationBtn">4</button>
            <button class="paginationBtn">5</button>
            <span class="paginationDots">...</span>
            <button class="paginationBtn">10</button>
            <button class="paginationBtn">></button>
          </div>
        </div>
      </div>

      <div class="page" id="parking-page">
        <h1 class="pageTitle">PARKING</h1>

        <div class="controlsRow">
          <div class="filterControls">
            <select class="filterDropdown" id="parkingLevelFilter">
              <option value="">Level</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
            <select class="filterDropdown" id="parkingBlockFilter">
              <option value="">Block</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
            <select class="filterDropdown" id="parkingStatusFilter">
              <option value="">Status</option>
              <option value="occupied">Occupied</option>
              <option value="vacant">Vacant</option>
              <option value="reserved">Reserved</option>
            </select>
            <div class="searchBox">
              <input type="text" placeholder="Search" class="searchInput" id="parkingSearchInput" />
              <button class="searchBtn">
                <img src="assets/icons/search-icon.png" alt="Search" />
              </button>
            </div>
            <button class="refreshBtn" id="parkingRefreshBtn">
              <img src="assets/icons/refresh-icon.png" alt="Refresh" />
            </button>
            <button class="downloadBtn" id="parkingDownloadBtn">
              <img src="assets/icons/download-icon.png" alt="Download" />
            </button>
          </div>
        </div>

        <div class="tableWrapper">
          <table>
            <thead>
              <tr>
                <th>Plate #</th>
                <th>Room</th>
                <th>Name</th>
                <th>Vehicle Type</th>
                <th>Entry Time</th>
                <th>Exit Time</th>
                <th>Slot Number</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="parkingTableBody">
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <span class="paginationInfo">Display Records <span id="parkingRecordCount">0</span></span>
          <div class="paginationControls">
            <button class="paginationBtn"><</button>
            <button class="paginationBtn active">1</button>
            <button class="paginationBtn">2</button>
            <button class="paginationBtn">3</button>
            <button class="paginationBtn">4</button>
            <button class="paginationBtn">5</button>
            <span class="paginationDots">...</span>
            <button class="paginationBtn">10</button>
            <button class="paginationBtn">></button>
          </div>
        </div>
      </div>

      <div class="page" id="inventory-page">
        <h1 class="pageTitle">INVENTORY</h1>

        <div class="controlsRow">
          <div class="filterControls">
            <select class="filterDropdown" id="inventoryCategoryFilter">
              <option value="">Category</option>
              <option value="Cleaning solution">Cleaning solution</option>
              <option value="Electrical">Electrical</option>
              <option value="Bathroom Supplies">Bathroom Supplies</option>
              <option value="Linens">Linens</option>
              <option value="Cleaning Equipment">Cleaning Equipment</option>
            </select>
            <select class="filterDropdown" id="inventoryStatusFilter">
              <option value="">Status</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
            <div class="searchBox">
              <input type="text" placeholder="Search" class="searchInput" id="inventorySearchInput" />
              <button class="searchBtn">
                <img src="assets/icons/search-icon.png" alt="Search" />
              </button>
            </div>
            <button class="refreshBtn" id="inventoryRefreshBtn">
              <img src="assets/icons/refresh-icon.png" alt="Refresh" />
            </button>
            <button class="downloadBtn" id="inventoryDownloadBtn">
              <img src="assets/icons/download-icon.png" alt="Download" />
            </button>
          </div>
        </div>

        <div class="tableWrapper">
          <table>
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
              </tr>
            </thead>
            <tbody id="inventoryTableBody">
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <span class="paginationInfo">Display Records <span id="inventoryRecordCount">0</span></span>
          <div class="paginationControls">
            <button class="paginationBtn"><</button>
            <button class="paginationBtn active">1</button>
            <button class="paginationBtn">2</button>
            <button class="paginationBtn">3</button>
            <button class="paginationBtn">4</button>
            <button class="paginationBtn">5</button>
            <span class="paginationDots">...</span>
            <button class="paginationBtn">10</button>
            <button class="paginationBtn">></button>
          </div>
        </div>
      </div>

      <div class="page" id="rooms-page">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
          <h1 class="pageTitle" style="margin-bottom: 0;">ROOMS</h1>
          
        </div>

        <div class="controlsRow">
          <div class="filterControls">
            <select class="filterDropdown" id="roomsFloorFilter">
              <option value="">Floor</option>
              </select>
            <select class="filterDropdown" id="roomsRoomFilter">
              <option value="">Room</option>
              </select>
            <select class="filterDropdown" id="roomsTypeFilter">
              <option value="">Room Type</option>
              <option value="Standard Room">Standard Room</option>
              <option value="Deluxe Room">Deluxe Room</option>
              <option value="Suite">Suite</option>
              <option value="Penthouse Suite">Penthouse Suite</option>
            </select>
            <select class="filterDropdown" id="roomsStatusFilter">
              <option value="">Status</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <div class="searchBox">
              <input type="text" placeholder="Search" class="searchInput" id="roomsSearchInput" />
              <button class="searchBtn">
                <img src="assets/icons/search-icon.png" alt="Search" />
              </button>
            </div>
            <button class="refreshBtn" id="roomsRefreshBtn">
              <img src="assets/icons/refresh-icon.png" alt="Refresh" />
            </button>
            <button class="downloadBtn" id="roomsDownloadBtn">
              <img src="assets/icons/download-icon.png" alt="Download" />
            </button>
            <button class="addRoomBtn" id="addRoomBtn">
              <img src="assets/icons/add-rooms.png" alt="Add-rooms" />
          </button>
          </div>
        </div>

        <div class="tableWrapper">
          <table>
            <thead>
              <tr>
                <th>Floor</th>
                <th>Room</th>
                <th>Type</th>
                <th>No. Guests</th>
                <th>Rate</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="roomsTableBody">
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <span class="paginationInfo">Display Records <span id="roomsRecordCount">0</span></span>
          <div class="paginationControls">
            <button class="paginationBtn"><</button>
            <button class="paginationBtn active">1</button>
            <button class="paginationBtn">2</button>
            <button class="paginationBtn">3</button>
            <button class="paginationBtn">4</button>
            <button class="paginationBtn">5</button>
            <span class="paginationDots">...</span>
            <button class="paginationBtn">10</button>
            <button class="paginationBtn">></button>
          </div>
        </div>
      </div>

      <div class="page" id="manage-users-page">
        <h1 class="pageTitle">MANAGE USERS</h1>
        <p class="pagePlaceholder">User management content will be displayed here.</p>
      </div>
    </main>
  </div>

  <div class="modalBackdrop" id="logoutModal" style="display: none;">
    <div class="logoutModal">
      <button class="closeBtn" id="closeLogoutBtn"></button>
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

  <div class="modalBackdrop" id="roomModal" style="display: none;">
    <div class="roomModal">
      <button class="closeBtn" id="closeRoomModalBtn"></button>
      <h2 id="roomModalTitle">Add New Room</h2>
      <form id="roomForm">
        <div class="formGrid">
          <div class="formGroup">
            <label for="roomFloor">Floor *</label>
            <input type="number" id="roomFloor" required min="1" max="10" />
          </div>
          <div class="formGroup">
            <label for="roomNumber">Room Number *</label>
            <input type="number" id="roomNumber" required min="100" max="999" />
          </div>
        </div>
        <div class="formGroup">
          <label for="roomType">Room Type *</label>
          <select id="roomType" required>
            <option value="">Select Type</option>
            <option value="Standard Room">Standard Room</option>
            <option value="Deluxe Room">Deluxe Room</option>
            <option value="Suite">Suite</option>
            <option value="Penthouse Suite">Penthouse Suite</option>
          </select>
        </div>
        <div class="formGroup">
          <label for="roomGuests">Guest Capacity *</label>
          <input type="text" id="roomGuests" required placeholder="" readonly />
        </div>
        <div class="formGroup">
          <label for="roomRate">Rate (per night) *</label>
          <input type="number" id="roomRate" required placeholder="e.g., 120.00" step="0.01" />
        </div>
        <div class="formGroup">
          <label for="roomStatus">Status *</label>
          <select id="roomStatus" required>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="reserved">Reserved</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <div class="modalButtons">
          <button type="button" class="modalBtn cancelBtn" id="cancelRoomBtn">CANCEL</button>
          <button type="submit" class="modalBtn confirmBtn" id="saveRoomBtn">SAVE ROOM</button>
        </div>
      </form>
    </div>
  </div>

  <div class="modalBackdrop" id="deleteRoomModal" style="display: none;">
    <div class="logoutModal">
      <button class="closeBtn" id="closeDeleteModalBtn"></button>
      
      <h2>Delete Room?</h2>
      <p id="deleteRoomText">Are you sure you want to delete this room? This action cannot be undone.</p>
      <div class="modalButtons">
        <button class="modalBtn cancelBtn" id="cancelDeleteBtn" style="background-color: rgb(175, 175, 175)">CANCEL</button>
        <button class="modalBtn confirmBtn" id="confirmDeleteBtn" style="background-color: FFA237">YES, DELETE</button>
      </div>
    </div>
  </div>

  <script src="script/shared-data.js"></script>
  <script src="script/admin.js"></script>
</body>
</html>