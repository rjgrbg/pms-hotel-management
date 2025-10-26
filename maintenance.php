<?php


// 2. Cache Control Headers
header('Cache-Control: no-cache, no-store, must-revalidate'); // HTTP 1.1.
header('Pragma: no-cache'); // HTTP 1.0.
header('Expires: 0'); // Proxies.

// 3. Check Login Status and Role (ONLY manager allowed)
include('check_session.php'); // Includes session_start() again, but it's ignored
require_login(['maintenance_manager']); // *** MODIFIED: Only allow manager ***

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

// 3. Fetch Rooms needing maintenance
$roomsNeedingMaintenance = [];
// *** Query specifically for rooms needing maintenance ***
$sql_rooms = "SELECT RoomID, FloorNumber, RoomNumber, LastMaintenance
              FROM room
              WHERE RoomStatus = 'Maintenance'
              ORDER BY FloorNumber, RoomNumber ASC";
if ($result_rooms = $conn->query($sql_rooms)) {
    while ($row = $result_rooms->fetch_assoc()) {
        $roomsNeedingMaintenance[] = [
            'id' => $row['RoomID'], // Room ID
            'floor' => $row['FloorNumber'],
            'room' => $row['RoomNumber'],
            'lastMaintenance' => $row['LastMaintenance'] ? date('Y-m-d g:i A', strtotime($row['LastMaintenance'])) : 'Never',
            // Add other fields needed by the table, ensure defaults
            'date' => date('Y-m-d'), // Assuming current date for request display
            'requestTime' => date('g:i A'), // Assuming current time, adjust if needed
            'status' => 'maintenance', // Explicitly set status for badge
            'staff' => 'Not Assigned' // Default staff status
        ];
    }
    $result_rooms->free();
} else {
    error_log("Error fetching rooms needing maintenance: " . $conn->error);
}

// 4. Fetch Maintenance Staff
$maintenanceStaff = [];
$sql_staff = "SELECT UserID, Fname, Lname, Mname FROM users WHERE AccountType = 'maintenance_staff'"; // Fetch only maintenance staff
if ($result_staff = $conn->query($sql_staff)) {
    while ($row = $result_staff->fetch_assoc()) {
        $staffName = trim(
                htmlspecialchars($row['Fname']) .
                (empty($row['Mname']) ? '' : ' ' . strtoupper(substr(htmlspecialchars($row['Mname']), 0, 1)) . '.') .
                ' ' .
                htmlspecialchars($row['Lname'])
            );
        $maintenanceStaff[] = [
            'id' => $row['UserID'],
            'name' => $staffName,
            'assigned' => false // Add logic later if needed
        ];
    }
    $result_staff->free();
} else {
    error_log("Error fetching maintenance staff: " . $conn->error);
}

// 5. Close the DB connection
$conn->close();

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Celestia Hotel - Maintenance Management</title>
    <link rel="stylesheet" href="css/maintenance.css"> <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
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
                <div class="profile-pic-container"><i class="fas fa-user-tie"></i></div>
                <h3><?php echo $Fname; ?></h3>
                <p><?php echo ucfirst($Accounttype); ?></p>
            </div>
            <nav class="profile-nav">
                <a href="#" id="account-details-link"><i class="fas fa-user-edit" style="margin-right: 10px;"></i> Account Details</a>
            </nav>
            <div class="profile-footer">
                <a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt" style="margin-right: 10px;"></i> Logout</a>
            </div>
        </aside>
    </header>

    <div class="modalBackdrop" id="logoutModal" style="display: none;">
        <div class="logoutModal">
            <button class="closeBtn" id="closeLogoutBtn">×</button>
            <div class="modalIcon"><img src="assets/icons/logout.png" alt="Logout" class="logoutIcon" /></div>
            <h2>Are you sure you want to logout?</h2>
            <p>You will be logged out from your account and redirected to the login page.</p>
            <div class="modalButtons">
                <button class="modalBtn cancelBtn" id="cancelLogoutBtn">CANCEL</button>
                <button class="modalBtn confirmBtn" id="confirmLogoutBtn">YES, LOGOUT</button>
            </div>
        </div>
    </div>

    <div class="mainContainer">
        <h1 class="pageTitle">MAINTENANCE</h1>

        <div class="tabNavigation">
            <button class="tabBtn active" data-tab="requests">
                <img src="assets/icons/requests-icon.png" alt="Requests" class="tabIcon" /> Requests
            </button>
            <button class="tabBtn" data-tab="history">
                <img src="assets/icons/history-icon.png" alt="History" class="tabIcon" /> History
            </button>
        </div>

        <div class="tabContent active" id="requests-tab">
            <div class="controlsRow">
                <div class="filterControls">
                    <select class="filterDropdown" id="floorFilter">
                        <option value="">Floor</option>
                        </select>
                    <select class="filterDropdown" id="roomFilter">
                        <option value="">Room</option>
                        </select>
                    <div class="searchBox">
                        <input type="text" placeholder="Search Room Number..." class="searchInput" id="searchInput" />
                        <button class="searchBtn"><img src="assets/icons/search-icon.png" alt="Search" /></button>
                    </div>
                    <button class="refreshBtn" id="refreshBtn"><img src="assets/icons/refresh-icon.png" alt="Refresh" /></button>
                    <button class="downloadBtn" id="downloadBtnRequests"><img src="assets/icons/download-icon.png" alt="Download" /></button>
                </div>
            </div>

            <div class="tableWrapper">
                <table class="requestsTable">
                    <thead>
                        <tr>
                            <th>Floor</th>
                            <th>Room</th>
                            <th>Date</th> <th>Request Time</th> <th>Last Maintenance</th> <th>Status</th>
                            <th>Staff In Charge</th>
                        </tr>
                    </thead>
                    <tbody id="requestsTableBody">
                        </tbody>
                </table>
            </div>
            <div class="pagination">
                <span class="paginationInfo">Display Records <span id="requestsRecordCount">0</span></span>
                <div class="paginationControls" id="requestsPaginationControls"></div>
            </div>
        </div>

        <div class="tabContent" id="history-tab">
            <div class="controlsRow">
                 <div class="filterControls">
                     <select class="filterDropdown" id="floorFilterHistory"><option value="">Floor</option></select>
                     <select class="filterDropdown" id="roomFilterHistory"><option value="">Room</option></select>
                     <select class="filterDropdown" id="dateFilterHistory"><option value="">Calendar</option></select>
                     <div class="searchBox">
                         <input type="text" placeholder="Search" class="searchInput" id="historySearchInput" />
                         <button class="searchBtn"><img src="assets/icons/search-icon.png" alt="Search" /></button>
                     </div>
                      <button class="refreshBtn" id="historyRefreshBtn"><img src="assets/icons/refresh-icon.png" alt="Refresh" /></button>
                     <button class="downloadBtn" id="historyDownloadBtn"><img src="assets/icons/download-icon.png" alt="Download" /></button>
                 </div>
             </div>
             <div class="tableWrapper">
                 <table class="historyTable">
                     <thead>
                         <tr>
                             <th>Floor</th>
                             <th>Room</th>
                             <th>Issue Type</th> <th>Date</th>
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
                     <div class="paginationControls" id="historyPaginationControls"></div>
                 </div>
             </div>
        </div>
    </div>

    <div class="modalBackdrop" id="staffModal" style="display: none;">
        <div class="staffSelectionModal">
            <button class="closeBtn" id="closeStaffModalBtn">×</button>
            <h2>SELECT STAFF MEMBER</h2>
            <p class="modalSubtext">Showing available Maintenance Staff</p> <div class="searchBox modalSearchBox">
                <input type="text" placeholder="Search staff..." class="searchInput" id="staffModalSearchInput" />
                <button class="searchBtn"><img src="assets/icons/search-icon.png" alt="Search" /></button>
            </div>
            <div class="staffList" id="staffList"></div>
            <div class="modalButtons">
                <button class="modalBtn cancelBtn" id="cancelStaffBtn">CLOSE</button>
                </div>
        </div>
    </div>

    <script>
        // *** Pass the correct PHP variables ***
        const initialRequestsData = <?php echo json_encode($roomsNeedingMaintenance); ?>; // Changed variable name
        const availableStaffData = <?php echo json_encode($maintenanceStaff); ?>;
        // const initialHistoryData = <?php // echo json_encode($fetchedHistoryData); ?>;
    </script>

    <script src="script/maintenance.js"></script> </body>
</html>