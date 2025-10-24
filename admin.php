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
?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width-device-width, initial-scale=1.0">
    <title>The Celestia Hotel - Admin Dashboard</title>
    <link rel="stylesheet" href="css/admin.css">

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
$Accounttype = htmlspecialchars($userData['Accounttype']); 

$conn->close();

?>
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
                    <h3 class="profileName"><?php echo $Fname; ?></h3>
                    <p class="profileRole"><?php echo $Accounttype; ?></p>
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

            <div class="page" id="rooms-page">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <h1 class="pageTitle" style="margin-bottom: 0;">ROOMS</h1>
                    
                </div>

                <div class="controlsRow">
                    <div class="filterControls">
                        <select class="filterDropdown" id="roomsFloorFilter">
                            <option value="">Floor</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                        </select>
                        <select class="filterDropdown" id="roomsRoomFilter">
                            <option value="">Room</option>
                            <option value="101">101</option>
                            <option value="102">102</option>
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

            <div class="page" id="manage-users-page">
                <h1 class="pageTitle">MANAGE USERS</h1>

                <div class="controlsRow">
                    <div class="filterControls">
                        <select class="filterDropdown" id="userRoleFilter">
                            <option value="">Role</option>
                            <option value="admin">Admin</option>
                            <option value="housekeeping">Housekeeping</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="parking">Parking</option>
                        </select>
                        <select class="filterDropdown" id="userStatusFilter">
                            <option value="">Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <div class="searchBox">
                            <input type="text" placeholder="Search by Name or ID" class="searchInput" id="userSearchInput" />
                            <button class="searchBtn">
                                <img src="assets/icons/search-icon.png" alt="Search" />
                            </button>
                        </div>
                        <button class="refreshBtn" id="userRefreshBtn">
                            <img src="assets/icons/refresh-icon.png" alt="Refresh" />
                        </button>
                        <button class="addUserBtn" id="addUserBtn">
                            <img src="assets/icons/add-user.png" alt="Add User" />
                        </button>
                    </div>
                </div>

                <div class="tableWrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th class="actions-col">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="userTableBody">
                            </tbody>
                    </table>
                </div>

                <div class="pagination">
                    <span class="paginationInfo">Display Records <span id="userRecordCount">0</span></span>
                    <div class="paginationControls">
                        <button class="paginationBtn user-prev-btn">←</button>
                        <button class="paginationBtn active">1</button>
                        <button class="paginationBtn">2</button>
                        <button class="paginationBtn">3</button>
                        <button class="paginationBtn user-next-btn">→</button>
                    </div>
                </div>
            </div>
            
        </main>
    </div>

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

    <div class="modalBackdrop" id="userModal" style="display: none;">
        <div class="employeeModal"> 
            <button class="closeBtn" id="closeUserModalBtn">×</button>
            
            <div class="employeeProfileHeader">
                <div class="employeeAvatar">
                    <img src="assets/icons/profile-icon.png" alt="Employee Avatar"> 
                </div>
                <div class="employeeInfo">
                    <h2 id="employeeNameDisplay">Juan Bagayan</h2> 
                    <p id="employeeIDDisplay">ID: 01928472845</p> 
                </div>
            </div>

            <form id="userForm">
                <input type="hidden" id="userIdHidden" value="" />
                
                <div class="formSection">
                    <div class="formRow two-col">
                        <div class="formGroup">
                            <label for="userFirstName">First Name *</label>
                            <input type="text" id="userFirstName" required />
                        </div>
                        <div class="formGroup">
                            <label for="userEmail">Email Address *</label>
                            <input type="email" id="userEmail" required />
                        </div>
                    </div>

                    <div class="formRow two-col">
                        <div class="formGroup">
                            <label for="userMiddleName">Middle Name (Optional)</label>
                            <input type="text" id="userMiddleName" />
                        </div>
                        <div class="formGroup">
                            <label for="userUsername">Username *</label>
                            <input type="text" id="userUsername" required />
                        </div>
                    </div>

                    <div class="formRow two-col">
                        <div class="formGroup">
                            <label for="userLastName">Last Name *</label>
                            <input type="text" id="userLastName" required />
                        </div>
                        <div class="formGroup">
                            <label for="userAccountType">Account Type *</label>
                            <select id="userAccountType" required>
                                <option value="Administrator">Administrator</option>
                                <option value="Housekeeping Manager">Housekeeping Manager</option>
                                <option value="Maintenance Manager">Maintenance Manager</option>
                                <option value="Inventory Manager">Inventory Manager</option>
                                <option value="Parking Manager">Parking Manager</option>
                                <option value="Housekeeping Staff">Housekeeping Staff</option>
                                <option value="Maintenance Staff">Maintenance Staff</option>
                            </select>
                        </div>
                    </div>

                    <div class="formRow three-col">
                        <div class="formGroup">
                            <label for="userBirthday">Birthday *</label>
                            <input type="date" id="userBirthday" required />
                        </div>
                        <div class="formGroup">
                            <label for="userContact">Contact *</label>
                            <input type="tel" id="userContact" required maxlength="11" /> 
                        </div>
                        <div class="formGroup">
                            <label for="userRoleDisplay">Role</label>
                            <input type="text" id="userRoleDisplay" readonly value="Administrator" />
                        </div>
                    </div>

                    <div class="formRow two-col">
                        <div class="formGroup">
                            <label for="userAddress">Address *</label>
                            <input type="text" id="userAddress" required />
                        </div>
                        <div class="formRow inline-group">
                            <div class="formGroup">
                                <label for="userShift">Shift</label>
                                <select id="userShift">
                                    <option value="Day">Day</option>
                                    <option value="Night">Night</option>
                                </select>
                            </div>
                            <div class="formGroup">
                                <label for="userPassword">Password</label>
                                <input type="password" id="userPassword" placeholder="Required for new user" />
                            </div>
                        </div>
                    </div>

                    <div class="modalButtons modal-footer-centered"> 
                        <p id="userFormError" style="color: #ff6b35; font-size: 13px; font-weight: 600; margin-bottom: 10px; display: none; text-align: center; width: 100%;">Error Placeholder</p> 
                        <button type="submit" class="modalBtn confirmBtn" id="saveUserBtn">ADD USER</button>
                    </div>

                    <input type="hidden" id="userRole" value="admin" />
                    <input type="hidden" id="userStatus" value="active" />
                </div>
            </form>
        </div>
    </div>

    <div class="modalBackdrop" id="deleteUserModal" style="display: none;">
        <div class="logoutModal">
            <button class="closeBtn" id="closeDeleteUserModalBtn">×</button>
            
            <h2>Delete User?</h2>
            <p id="deleteUserText">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div class="modalButtons">
                <button class="modalBtn cancelBtn" id="cancelDeleteUserBtn" style="background-color: rgb(237, 231, 233)">CANCEL</button>
                <button class="modalBtn confirmBtn" id="confirmDeleteUserBtn" style="background-color: FFA237">YES, DELETE</button>
            </div>
        </div>
    </div>
    
    <div class="modalBackdrop" id="roomModal" style="display: none;">
        <div class="roomModal">
            <button class="closeBtn" id="closeRoomModalBtn">×</button>
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
                    <input type="text" id="roomGuests" required placeholder="e.g., 1-2 guests" />
                </div>
                <div class="formGroup">
                    <label for="roomRate">Rate (per night) *</label>
                    <input type="text" id="roomRate" required placeholder="e.g., $120" />
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
            <button class="closeBtn" id="closeDeleteModalBtn">×</button>
            
            <h2>Delete Room?</h2>
            <p id="deleteRoomText">Are you sure you want to delete this room? This action cannot be undone.</p>
            <div class="modalButtons">
                <button class="modalBtn cancelBtn" id="cancelDeleteBtn" style="background-color: rgb(237, 231, 233)">CANCEL</button>
                <button class="modalBtn confirmBtn" id="confirmDeleteBtn" style="background-color: FFA237">YES, DELETE</button>
            </div>
        </div>
    </div>

    <script src="script/shared-data.js"></script>
    <script src="script/admin.js"></script>
</body>
</html>