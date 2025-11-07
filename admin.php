<?php
// Include the session check and login requirement logic
include('check_session.php');

// Only allow users with the 'admin' AccountType
require_login(['admin']);

// --- Fetch User Data from Database ---
include('db_connection.php'); // Ensure DB connection is included
header('Cache-Control: no-cache, no-store, must-revalidate'); 
header('Pragma: no-cache');
header('Expires: 0');
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
                    $formattedName = 'Admin'; // Fallback to default
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
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js"></script> 
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
              <p class="statValue">0</p>
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
              <p class="statValue">0</p>
            </div>
            <div class="statCard">
              <h3 class="statLabel">Low Stock</h3>
              <p class="statValue">0</p>
            </div>
            <div class="statCard">
              <h3 class="statLabel">Out of Stock</h3>
              <p class="statValue">0</p>
            </div>
          </div>
        </section>

        <section class="dashboardSection">
          <h2 class="sectionTitle">Parking</h2>
          <div class="statsGrid">
            <div class="statCard">
              <h3 class="statLabel">Total Slots</h3>
              <p class="statValue">0</p>
            </div>
            <div class="statCard">
              <h3 class="statLabel">Occupied</h3>
              <p class="statValue">0</p>
            </div>
            <div class="statCard">
              <h3 class="statLabel">Vacant</h3>
              <p class="statValue">0</p>
            </div>
            <div class="statCard">
              <h3 class="statLabel">Reserved</h3>
              <p class="statValue">0</p>
            </div>
          </div>
        </section>

        <section class="dashboardSection">
          <h2 class="sectionTitle">Users</h2>
          <div class="statsGrid">
            <div class="statCard">
              <h3 class="statLabel">Total Employees</h3>
              <p class="statValue">0</p>
              <p class="statSubtext"></p>
            </div>
            <div class="statCard">
              <h3 class="statLabel">Housekeeping</h3>
              <p class="statValue">0</p>
            </div>
            <div class="statCard">
              <h3 class="statLabel">Maintenance</h3>
              <p class="statValue">0</p>
            </div>
            <div class="statCard">
              <h3 class="statLabel">Parking</h3>
              <p class="statValue">0</p>
            </div>
          </div>
        </section>
      </div>

      <div class="page" id="housekeeping-page">
        <h1 class="pageTitle">HOUSEKEEPING</h1>

        <div class="tabNavigation">
          <button class="tabBtn active" data-hk-tab="hk-requests">
            Requests
          </button>
          <button class="tabBtn" data-hk-tab="hk-history">
            History
          </button>
          <button class="tabBtn" data-hk-tab="hk-linens-amenities">
            Linens & Amenities
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
               </div>
          </div>
        </div>

        <div class="tabContent" id="hk-linens-amenities-tab">
          
          <div class="subTabNavigation">
            <button class="subTabBtn active" data-hk-subtab="linens">
              Linens
            </button>
            <button class="subTabBtn" data-hk-subtab="amenities">
              Amenities
            </button>
          </div>

          <div class="subTabContent active" id="linens-subtab">
            <div class="controlsRow">
              <div class="filterControls">
                <select class="filterDropdown" id="floorFilterLinens">
                  <option value="">Floor</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
                <select class="filterDropdown" id="roomFilterLinens">
                  <option value="">Room</option>
                  <option value="101">101</option>
                  <option value="102">102</option>
                </select>
                <select class="filterDropdown" id="statusFilterLinens">
                  <option value="">Status</option>
                  <option value="cleaned">Cleaned</option>
                  <option value="pending">Pending</option>
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
              </div>
            </div>

            <div class="tableWrapper">
              <table>
                <thead>
                  <tr>
                    <th>Floor</th>
                    <th>Room</th>
                    <th>Types</th>
                    <th>Items</th>
                    <th>Time/Date</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody id="hkLinensTableBody">
                   </tbody>
              </table>
            </div>

            <div class="pagination">
              <span class="paginationInfo">Display Records <span id="hkLinensRecordCount">0</span></span>
              <div class="paginationControls">
                 </div>
            </div>
          </div>

          <div class="subTabContent" id="amenities-subtab">
            <div class="controlsRow">
              <div class="filterControls">
                <select class="filterDropdown" id="floorFilterAmenities">
                  <option value="">Floor</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
                <select class="filterDropdown" id="roomFilterAmenities">
                  <option value="">Room</option>
                  <option value="101">101</option>
                  <option value="102">102</option>
                </select>
                <select class="filterDropdown" id="statusFilterAmenities">
                  <option value="">Status</option>
                  <option value="stocked">Stocked</option>
                  <option value="pending">Pending</option>
                </select>
                <div class="searchBox">
                  <input type="text" placeholder="Search" class="searchInput" id="amenitiesSearchInput" />
                  <button class="searchBtn">
                    <img src="assets/icons/search-icon.png" alt="Search" />
                  </button>
                </div>
                <button class="refreshBtn" id="amenitiesRefreshBtn">
                  <img src="assets/icons/refresh-icon.png" alt="Refresh" />
                </button>
                <button class="downloadBtn" id="amenitiesDownloadBtn">
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
                    <th>Types</th>
                    <th>Items</th>
                    <th>Time/Date</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody id="hkAmenitiesTableBody">
                   </tbody>
              </table>
            </div>

            <div class="pagination">
              <span class="paginationInfo">Display Records <span id="hkAmenitiesRecordCount">0</span></span>
              <div class="paginationControls">
                 </div>
            </div>
          </div>
        </div>
      </div>

      <div class="page" id="maintenance-page">
        <h1 class="pageTitle">MAINTENANCE</h1>

        <div class="tabNavigation">
          <button class="tabBtn active" data-mt-tab="mt-requests">
            Requests
          </button>
          <button class="tabBtn" data-mt-tab="mt-history">
            History
          </button>
          <button class="tabBtn" data-mt-tab="mt-appliances">
            Appliances
          </button>
        </div>

        <div class="tabContent active" id="mt-requests-tab">
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
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="repaired">Repaired</option>
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
              <tbody id="mtRequestsTableBody">
                </tbody>
            </table>
          </div>

          <div class="pagination">
            <span class="paginationInfo">Display Records <span id="mtRequestsRecordCount">0</span></span>
            <div class="paginationControls">
              </div>
          </div>
        </div>

        <div class="tabContent" id="mt-history-tab">
          <div class="controlsRow">
            <div class="filterControls">
              <select class="filterDropdown" id="mtFloorFilterHist">
                <option value="">Floor</option>
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
              <select class="filterDropdown" id="mtRoomFilterHist">
                <option value="">Room</option>
                <option value="101">101</option>
                <option value="102">102</option>
              </select>
              <div class="searchBox">
                <input type="text" placeholder="Search" class="searchInput" id="mtHistSearchInput" />
                <button class="searchBtn">
                  <img src="assets/icons/search-icon.png" alt="Search" />
                </button>
              </div>
              <button class="refreshBtn" id="mtHistRefreshBtn">
                <img src="assets/icons/refresh-icon.png" alt="Refresh" />
              </button>
              <button class="downloadBtn" id="mtHistDownloadBtn">
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
              <tbody id="mtHistTableBody">
                </tbody>
            </table>
          </div>

          <div class="pagination">
            <span class="paginationInfo">Display Records <span id="mtHistRecordCount">0</span></span>
            <div class="paginationControls">
              </div>
          </div>
        </div>

        <div class="tabContent" id="mt-appliances-tab">
          <div class="controlsRow">
            <div class="filterControls">
              <select class="filterDropdown" id="appFloorFilter">
                <option value="">Floor</option>
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
              <select class="filterDropdown" id="appRoomFilter">
                <option value="">Room</option>
                <option value="101">101</option>
                <option value="102">102</option>
              </select>
              <select class="filterDropdown" id="appTypeFilter">
                <option value="">Type</option>
                <option value="Electric">Electric</option>
                <option value="Water System">Water System</option>
                <option value="HVAC">HVAC</option>
              </select>
              <div class="searchBox">
                <input type="text" placeholder="Search" class="searchInput" id="appliancesSearchInput" />
                <button class="searchBtn">
                  <img src="assets/icons/search-icon.png" alt="Search" />
                </button>
              </div>
              <button class="refreshBtn" id="appliancesRefreshBtn">
                <img src="assets/icons/refresh-icon.png" alt="Refresh" />
              </button>
              <button class="downloadBtn" id="appliancesDownloadBtn">
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
                  <th>Installed Date</th>
                  <th>Types</th>
                  <th>Items</th>
                  <th>Last Maintained</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody id="mtAppliancesTableBody">
                </tbody>
            </table>
          </div>

          <div class="pagination">
            <span class="paginationInfo">Display Records <span id="mtAppliancesRecordCount">0</span></span>
            <div class="paginationControls">
              </div>
          </div>
        </div>
      </div>

      <div class="page" id="parking-page">
        <h1 class="pageTitle">PARKING HISTORY</h1>

        <div class="controlsRow">
          <div class="filterControls">
            <select class="filterDropdown" id="parkingAreaFilter">
              <option value="all">All Areas</option>
              </select>
            <div class="searchBox">
              <input type="text" placeholder="Search Plate, Name, Room..." class="searchInput" id="parkingHistorySearchInput" />
              <button class="searchBtn">
                <img src="assets/icons/search-icon.png" alt="Search" />
              </button>
            </div>
            <button class="refreshBtn" id="parkingHistoryRefreshBtn">
              <img src="assets/icons/refresh-icon.png" alt="Refresh" />
            </button>
            <button class="downloadBtn" id="parkingHistoryDownloadBtn">
              <img src="assets/icons/download-icon.png" alt="Download" />
            </button>
          </div>
        </div>

        <div class="tableWrapper">
          <table>
            <thead>
              <tr>
                <th>Slot Number</th>
                <th>Plate #</th>
                <th>Room</th>
                <th>Name</th>
                <th>Vehicle Type</th>
                <th>Category</th>
                <th>Parking Time</th>
                <th>Enter Time/Date</th>
                <th>Exit Time/Date</th>
              </tr>
            </thead>
            <tbody id="parkingHistoryTableBody">
              </tbody>
          </table>
        </div>

        <div class="pagination">
          <span class="paginationInfo">Display Records <span id="parkingHistoryRecordCount">0</span></span>
          <div class="paginationControls">
             </div>
        </div>
      </div>

      <div class="page" id="inventory-page">
  <h1 class="pageTitle">INVENTORY</h1>

  <div class="tabNavigation">
    <button class="tabBtn active" data-inv-tab="inv-items">
      Items
    </button>
    <button class="tabBtn" data-inv-tab="inv-history">
      History
    </button>
  </div>

  <div class="tabContent active" id="inv-items-tab">
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
        <tbody id="inventoryTableBody"></tbody>
      </table>
    </div>

    <div class="pagination">
      <span class="paginationInfo">Display Records <span id="inventoryRecordCount">0</span></span>
      <div class="paginationControls"></div>
    </div>
  </div>

  <div class="tabContent" id="inv-history-tab">
    <div class="controlsRow">
      <div class="filterControls">
        <select class="filterDropdown" id="invHistCategoryFilter">
          <option value="">Category</option>
          <option value="Cleaning solution">Cleaning solution</option>
          <option value="Electrical">Electrical</option>
          <option value="Bathroom Supplies">Bathroom Supplies</option>
          <option value="Linens">Linens</option>
          <option value="Cleaning Equipment">Cleaning Equipment</option>
        </select>
        <select class="filterDropdown" id="invHistActionFilter">
          <option value="">Action</option>
          <option value="Stock In">Stock In</option>
          <option value="Stock Out">Stock Out</option>
        </select>
        <div class="searchBox">
          <input type="text" placeholder="Search" class="searchInput" id="invHistSearchInput" />
          <button class="searchBtn">
            <img src="assets/icons/search-icon.png" alt="Search" />
          </button>
        </div>
        <button class="refreshBtn" id="invHistRefreshBtn">
          <img src="assets/icons/refresh-icon.png" alt="Refresh" />
        </button>
        <button class="downloadBtn" id="invHistDownloadBtn">
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
            <th>Action</th>
            <th>Transaction Date</th>
            <th>Performed By</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody id="invHistTableBody"></tbody>
      </table>
    </div>

    <div class="pagination">
      <span class="paginationInfo">Display Records <span id="invHistRecordCount">0</span></span>
      <div class="paginationControls"></div>
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
              <option value="Available">Available</option>
              <option value="Needs Cleaning">Needs Cleaning</option>
              <option value="Maintenance">Maintenance</option>
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
            </div>
        </div>
      </div>

      <div class="page" id="manage-users-page">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
          <h1 class="pageTitle" style="margin-bottom: 0;">MANAGE USERS</h1>
        </div>

        <div class="tabNavigation">
          <button class="tabBtn active" data-user-tab="user-management">
            User Management
          </button>
          <button class="tabBtn" data-user-tab="user-logs">
            User Logs
          </button>
        </div>

        <div class="tabContent active" id="user-management-tab">
          <div class="controlsRow">
            <div class="filterControls">
              <select class="filterDropdown" id="usersRoleFilter">
                <option value="">Role</option>
                <option value="admin">Admin</option>
                <option value="housekeeping_manager">Housekeeping Manager</option>
                <option value="inventory_manager">Inventory Manager</option>
                <option value="maintenance_manager">Maintenance Manager</option>
                <option value="parking_manager">Parking Manager</option>
                <option value="housekeeping_staff">Housekeeping Staff</option>
                <option value="maintenance_staff">Maintenance Staff</option>
              </select>
              <select class="filterDropdown" id="usersShiftFilter">
                <option value="">Shift</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Night">Night</option>
              </select>
              <div class="searchBox">
                <input type="text" placeholder="Search Name or Username" class="searchInput" id="usersSearchInput" />
                <button class="searchBtn">
                  <img src="assets/icons/search-icon.png" alt="Search" />
                </button>
              </div>
              <button class="refreshBtn" id="usersRefreshBtn">
                <img src="assets/icons/refresh-icon.png" alt="Refresh" />
              </button>
              <button class="downloadBtn" id="usersDownloadBtn" title="Download User Data (CSV)">
                <img src="assets/icons/download-icon.png" alt="Download" />
              </button>
              <button class="addRoomBtn" id="addUserBtn" title="Add New User">
                <img src="assets/icons/add-user.png" alt="Add User" />
              </button>
            </div>
          </div>

          <div class="tableWrapper">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Shift</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="usersTableBody"></tbody>
            </table>
          </div>

          <div class="pagination">
            <span class="paginationInfo">Display Records <span id="usersRecordCount">0</span></span>
            <div class="paginationControls"></div>
          </div>
        </div>

        <div class="tabContent" id="user-logs-tab">
          <div class="controlsRow">
            <div class="filterControls">
              <select class="filterDropdown" id="logsRoleFilter">
                <option value="">Role</option>
                <option value="admin">Admin</option>
                <option value="housekeeping_manager">Housekeeping Manager</option>
                <option value="maintenance_manager">Maintenance Manager</option>
                <option value="inventory_manager">Inventory Manager</option>
                <option value="parking_manager">Parking Manager</option>
                <option value="housekeeping_staff">Housekeeping Staff</option>
                <option value="maintenance_staff">Maintenance Staff</option>
              </select>
              <select class="filterDropdown" id="logsShiftFilter">
                <option value="">Shift</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Night">Night</option>
              </select>
              <div class="searchBox">
                <input type="text" placeholder="Search" class="searchInput" id="logsSearchInput" />
                <button class="searchBtn">
                  <img src="assets/icons/search-icon.png" alt="Search" />
                </button>
              </div>
              <button class="refreshBtn" id="logsRefreshBtn">
                <img src="assets/icons/refresh-icon.png" alt="Refresh" />
              </button>
              <button class="downloadBtn" id="logsDownloadBtn" title="Download Logs (CSV)">
                <img src="assets/icons/download-icon.png" alt="Download" />
              </button>
            </div>
          </div>

          <div class="tableWrapper">
            <table>
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>User ID</th>
                  <th>Last Name</th>
                  <th>First Name</th>
                  <th>Middle Name</th>
                  <th>Account Type</th>
                  <th>Role</th>
                  <th>Shift</th>
                  <th>Username</th>
                  <th>Email Address</th>
                  <th>Action Type</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody id="logsTableBody"></tbody>
            </table>
          </div>

          <div class="pagination">
            <span class="paginationInfo">Display Records <span id="logsRecordCount">0</span></span>
            <div class="paginationControls"></div>
          </div>
        </div>
      </div>
    </main>
  </div>

 <div class="modalBackdrop" id="roomModal" style="display: none;">
    <div class="roomModal">
      <button class="closeBtn" id="closeRoomModalBtn">&times;</button>
      <h2 id="roomModalTitle">Edit Room Status</h2>
      <div id="roomFormMessage" class="formMessage" style="display:none;"></div>
      
      <form id="roomForm">
        <div class="formGrid">
          <div class="formGroup">
            <label for="roomFloor">Floor</label>
            <select id="roomFloor" name="roomFloor" required disabled>
              <option value="">Select Floor</option>

              <option value="5">5</option>
            </select>
          </div>
          <div class="formGroup">
            <label for="roomNumber">Room Number</label>
            <input type="text" id="roomNumber" name="roomNumber" required placeholder="e.g., 101" readonly />
          </div>
        </div>
        
        <div class="formGroup">
          <label for="roomType">Room Type</label>
          <select id="roomType" name="roomType" required disabled>
            <option value="">Select Type</option>

            <option value="Penthouse Suite">Penthouse Suite</option>
          </select>
        </div>
        
        <div class="formGroup">
          <label for="roomGuests">Guest Capacity</label>
          <input type="text" id="roomGuests" name="roomGuests" readonly disabled />
        </div>
        
        <div class="formGroup">
          <label for="roomRate">Rate (per night)</label>
          <input type="number" id="roomRate" name="roomRate" required step="0.01" placeholder="e.g., 120.00" disabled />
        </div>
        
     <div class="formGroup">
          <label for="roomStatus">Status *</label>
          <select id="roomStatus" name="roomStatus" required>
            <option value="">Select Status</option>
            <option value="Needs Cleaning">Needs Cleaning</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
        
        <div class="modalButtons">
          <button type="button" class="modalBtn cancelBtn" id="cancelRoomBtn">CANCEL</button>
          <button type="submit" class="modalBtn confirmBtn" id="saveRoomBtn">SAVE STATUS</button>
        </div>
      </form>
    </div>
  </div>

  <div class="modalBackdrop" id="deleteRoomModal" style="display: none;">
    <div class="logoutModal">
      <button class="closeBtn" id="closeDeleteModalBtn">&times;</button>
      <div class="modalIcon">
        <img src="assets/icons/warning-icon.png" alt="Warning" class="logoutIcon" />
      </div>
      <h2>Delete Room</h2>
      <p id="deleteRoomText">Are you sure you want to delete this room?</p>
      <div class="modalButtons">
        <button class="modalBtn cancelBtn" id="cancelDeleteBtn">CANCEL</button>
        <button class="modalBtn confirmBtn" id="confirmDeleteBtn">DELETE</button>
      </div>
    </div>
  </div>

  <div class="modalBackdrop" id="userModal" style="display: none;">
    <div class="addUserModal">
      <button class="closeBtn" id="closeUserModalBtn">&times;</button>
      <h2 id="userModalTitle">Add New User</h2>
      <div id="userFormMessage" class="formMessage" style="display:none;"></div>
      
      <form id="employeeIdForm" style="display: block;">
        <div class="formGroup">
          <label for="employeeId">Employee ID</label>
          <input type="text" id="employeeId" name="employeeId" required placeholder="Enter Employee ID" />
        </div>
        <div class="modalButtons">
          <button type="button" class="modalBtn cancelBtn" id="cancelEmployeeIdBtn">CANCEL</button>
          <button type="submit" class="modalBtn confirmBtn" id="lookupEmployeeBtn">ADD EMPLOYEE</button>
        </div>
      </form>

      <form id="userEditForm" style="display: none;">
        <input type="hidden" id="editUserId" name="userID">
        
        <div class="userProfileSection">
          <div class="profileAvatar">
            <img src="assets/icons/profile-icon.png" alt="Profile" />
          </div>
          <h3 id="editUserFullName" class="editUserName">User Full Name</h3>
          <p id="editUserEmployeeId" class="editUserEmployeeId">Employee ID: ------</p>
        </div>
        
        <div class="formGroup">
          <label for="userUsername">Username *</label>
          <input type="text" id="userUsername" name="username" required />
        </div>
        
        <div class="formGroup">
          <label for="userPassword">New Password (Optional)</label>
          <input type="password" id="userPassword" name="password" placeholder="Leave blank to keep unchanged" />
        </div>
        
        <div class="formGroup">
          <label for="userAccountType">Account Type *</label>
          <select id="userAccountType" name="accountType" required>
            <option value="">Select Role</option>
            <option value="admin">Administrator</option>
            <option value="housekeeping_manager">Housekeeping Manager</option>
            <option value="maintenance_manager">Maintenance Manager</option>
            <option value="inventory_manager">Inventory Manager</option>
            <option value="parking_manager">Parking Manager</option>
            <option value="housekeeping_staff">Housekeeping Staff</option>
            <option value="maintenance_staff">Maintenance Staff</option>
          </select>
        </div>

        <div class="formGroup">
          <label for="userShift">Shift *</label>
          <select id="userShift" name="shift" required>
            <option value="">Select Shift</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Night">Night</option>
          </select>
        </div>
        <div class="modalButtons">
          <button type="button" class="modalBtn cancelBtn" id="cancelUserEditBtn">CANCEL</button>
          <button type="submit" class="modalBtn confirmBtn" id="saveUserBtn">UPDATE USER</button>
        </div>
      </form>
    </div>
  </div>

  <div class="modalBackdrop" id="deleteUserModal" style="display: none;">
    <div class="logoutModal">
      <button class="closeBtn" id="closeDeleteUserModalBtn">&times;</button>
      <div class="modalIcon">
        <img src="assets/icons/warning-icon.png" alt="Warning" class="logoutIcon" />
      </div>
      <h2>Delete User</h2>
      <p id="deleteUserText">Are you sure you want to delete this user?</p>
      <div class="modalButtons">
        <button class="modalBtn cancelBtn" id="cancelDeleteUserBtn">CANCEL</button>
        <button class="modalBtn confirmBtn" id="confirmDeleteUserBtn">DELETE</button>
      </div>
    </div>
  </div>

  <div class="modalBackdrop" id="logoutModal" style="display: none;">
    <div class="logoutModal">
      <button class="closeBtn" id="closeLogoutBtn">&times;</button>
      <div class="modalIcon">
        <img src="assets/icons/logout.png" alt="Logout" class="logoutIcon" />
      </div>
      <h2>Confirm Logout</h2>
      <p>Are you sure you want to logout?</p>
      <div class="modalButtons">
        <button class="modalBtn cancelBtn" id="cancelLogoutBtn">CANCEL</button>
        <button class="modalBtn confirmBtn" id="confirmLogoutBtn">LOGOUT</button>
      </div>
    </div>
  </div>

  <script src="script/shared-data.js"></script>
  <script src="script/admin.js"></script>
</body>
</html>