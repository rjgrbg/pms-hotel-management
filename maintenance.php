<?php
// 1. Cache Control Headers
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// 2. Check Login Status and Role
include('check_session.php');
require_login(['maintenance_manager']);

// 3. Load database and user data
require_once('db_connection.php');
require_once('User.php');
$userData = getUserData($conn);
$Fname = htmlspecialchars($userData['Name']);
$Accounttype = htmlspecialchars($userData['Accounttype']);

// 4. Fetch Rooms needing maintenance
$roomsNeedingMaintenance = [];
$sql_rooms = "SELECT RoomID, FloorNumber, RoomNumber, LastMaintenance
              FROM room
              WHERE RoomStatus = 'Maintenance'
              ORDER BY FloorNumber, RoomNumber ASC";
if ($result_rooms = $conn->query($sql_rooms)) {
    while ($row = $result_rooms->fetch_assoc()) {
        $roomsNeedingMaintenance[] = [
            'id' => $row['RoomID'],
            'floor' => $row['FloorNumber'],
            'room' => $row['RoomNumber'],
            'lastMaintenance' => $row['LastMaintenance'] ? date('Y-m-d g:i A', strtotime($row['LastMaintenance'])) : 'Never',
            'date' => date('Y-m-d'),
            'requestTime' => date('g:i A'),
            'status' => 'maintenance',
            'staff' => 'Not Assigned'
        ];
    }
    $result_rooms->free();
} else {
    error_log("Error fetching rooms needing maintenance: " . $conn->error);
}

// 5. Fetch Maintenance Staff
$maintenanceStaff = [];
$sql_staff = "SELECT UserID, Fname, Lname, Mname FROM users WHERE AccountType = 'maintenance_staff'";
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
            'assigned' => false
        ];
    }
    $result_staff->free();
} else {
    error_log("Error fetching maintenance staff: " . $conn->error);
}

// 6. Fetch Appliances Types (sample data)
$appliancesTypes = ['Electric', 'Water System', 'HVAC', 'Plumbing'];

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

// 8. Fetch Appliances (using sample data for now)
$appliancesData = [
    [
        'id' => 1,
        'roomId' => 1,
        'floor' => 1,
        'room' => 101,
        'installedDate' => '10.25.2025',
        'type' => 'Electric',
        'item' => 'TV (Brand)',
        'lastMaintained' => '3:30PM/10.25.2025',
        'status' => 'Working',
        'remarks' => 'Working properly'
    ],
    [
        'id' => 2,
        'roomId' => 1,
        'floor' => 1,
        'room' => 101,
        'installedDate' => '10.25.2025',
        'type' => 'Water System',
        'item' => 'Heater (Brand)',
        'lastMaintained' => '3:30PM/10.25.2025',
        'status' => 'Working',
        'remarks' => 'Serviced'
    ],
    [
        'id' => 3,
        'roomId' => 2,
        'floor' => 2,
        'room' => 201,
        'installedDate' => '10.20.2025',
        'type' => 'Electric',
        'item' => 'Refrigerator',
        'lastMaintained' => '2:00PM/10.24.2025',
        'status' => 'Needs Repair',
        'remarks' => 'Needs check'
    ],
    [
        'id' => 4,
        'roomId' => 3,
        'floor' => 2,
        'room' => 202,
        'installedDate' => '10.22.2025',
        'type' => 'HVAC',
        'item' => 'Air Conditioner',
        'lastMaintained' => '4:00PM/10.25.2025',
        'status' => 'Working',
        'remarks' => 'Filter replaced'
    ]
];

// 9. Fetch History Data (sample data)
$historyData = [
    [
        'id' => 1,
        'floor' => 1,
        'room' => 101,
        'issueType' => 'Electric',
        'date' => '10.20.2025',
        'requestedTime' => '2:30 PM',
        'completedTime' => '4:15 PM',
        'staff' => 'John Doe',
        'status' => 'Completed',
        'remarks' => 'TV repaired successfully'
    ],
    [
        'id' => 2,
        'floor' => 1,
        'room' => 101,
        'issueType' => 'Water System',
        'date' => '10.22.2025',
        'requestedTime' => '9:00 AM',
        'completedTime' => '11:30 AM',
        'staff' => 'Jane Smith',
        'status' => 'Completed',
        'remarks' => 'Water heater serviced'
    ],
    [
        'id' => 3,
        'floor' => 2,
        'room' => 201,
        'issueType' => 'HVAC',
        'date' => '10.23.2025',
        'requestedTime' => '1:00 PM',
        'completedTime' => '3:45 PM',
        'staff' => 'Mike Johnson',
        'status' => 'Completed',
        'remarks' => 'AC filter replaced'
    ],
    [
        'id' => 4,
        'floor' => 2,
        'room' => 202,
        'issueType' => 'Plumbing',
        'date' => '10.24.2025',
        'requestedTime' => '10:00 AM',
        'completedTime' => '12:30 PM',
        'staff' => 'John Doe',
        'status' => 'Completed',
        'remarks' => 'Pipe leak fixed'
    ],
    [
        'id' => 5,
        'floor' => 3,
        'room' => 301,
        'issueType' => 'Electric',
        'date' => '10.25.2025',
        'requestedTime' => '8:00 AM',
        'completedTime' => '10:00 AM',
        'staff' => 'Jane Smith',
        'status' => 'Completed',
        'remarks' => 'Light fixture replaced'
    ]
];

// 10. Close database connection
$conn->close();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Celestia Hotel - Maintenance Management</title>
    <link rel="stylesheet" href="css/maintenance.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <!-- HEADER -->
    <header class="header">
        <div class="headerLeft">
            <img src="assets/images/celestia-logo.png" alt="Logo" class="headerLogo" />
            <span class="hotelName">THE CELESTIA HOTEL</span>
        </div>
        <img src="assets/icons/profile-icon.png" alt="Profile" class="profileIcon" id="profileBtn" />
        
        <!-- PROFILE SIDEBAR -->
        <aside class="profile-sidebar" id="profile-sidebar">
            <button class="sidebar-close-btn" id="sidebar-close-btn">&times;</button>
            <div class="profile-header">
                <div class="profile-pic-container"><i class="fas fa-user-tie"></i></div>
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

    <!-- LOGOUT MODAL -->
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

    <!-- MAIN CONTAINER -->
    <div class="mainContainer">
        <h1 class="pageTitle">MAINTENANCE</h1>

        <!-- TAB NAVIGATION -->
        <div class="tabNavigation">
            <button class="tabBtn active" data-tab="requests">
                <img src="assets/icons/requests-icon.png" alt="Requests" class="tabIcon" />
                Requests
            </button>
            <button class="tabBtn" data-tab="history">
                <img src="assets/icons/history-icon.png" alt="History" class="tabIcon" />
                History
            </button>
            <button class="tabBtn" data-tab="appliances">
                <img src="assets/icons/appliances.png" alt="Appliances" class="tabIcon" />
                Appliances
            </button>
        </div>

        <!-- REQUESTS TAB -->
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
                            <th>Last Maintenance</th>
                            <th>Status</th>
                            <th>Staff In Charge</th>
                        </tr>
                    </thead>
                    <tbody id="requestsTableBody"></tbody>
                </table>
            </div>
            <div class="pagination">
                <span class="paginationInfo">Display Records <span id="requestsRecordCount">0</span></span>
                <div class="paginationControls" id="requestsPaginationControls"></div>
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
                            <th>Issue Type</th>
                            <th>Date</th>
                            <th>Requested Time</th>
                            <th>Completed Time</th>
                            <th>Staff In Charge</th>
                            <th>Status</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody id="historyTableBody"></tbody>
                </table>
            </div>
            <div class="pagination">
                <span class="paginationInfo">Display Records <span id="historyRecordCount">0</span></span>
                <div class="paginationControls" id="historyPaginationControls"></div>
            </div>
        </div>

        <!-- APPLIANCES TAB -->
        <div class="tabContent" id="appliances-tab">
            <div class="controlsRow">
                <div class="filterControls">
                    <select class="filterDropdown" id="floorFilterAppliances">
                        <option value="">Floor</option>
                    </select>
                    <select class="filterDropdown" id="roomFilterAppliances">
                        <option value="">Room</option>
                    </select>
                    <select class="filterDropdown" id="typeFilterAppliances">
                        <option value="">Type</option>
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
                    <button class="addItemBtnInline" id="addApplianceBtn">
                        <img src="assets/icons/add.png" alt="Add" />
                    </button>
                </div>
            </div>

            <div class="tableWrapper">
                <table class="appliancesTable">
                    <thead>
                        <tr>
                            <th>FLOOR</th>
                            <th>ROOM</th>
                            <th>INSTALLED DATE</th>
                            <th>TYPES</th>
                            <th>ITEMS</th>
                            <th>LAST MAINTAINED</th>
                            <th>STATUS</th>
                            <th>REMARKS</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody id="appliancesTableBody"></tbody>
                </table>
            </div>
            <div class="pagination">
                <span class="paginationInfo">Display Records <span id="appliancesRecordCount">0</span></span>
                <div class="paginationControls" id="appliancesPaginationControls"></div>
            </div>
        </div>
    </div>

    <!-- STAFF SELECTION MODAL -->
    <div class="modalBackdrop" id="staffModal" style="display: none;">
        <div class="staffSelectionModal">
            <button class="closeBtn" id="closeStaffModalBtn">×</button>
            <h2>SELECT STAFF MEMBER</h2>
            <p class="modalSubtext">Showing available Maintenance Staff</p>
            <div class="searchBox modalSearchBox">
                <input type="text" placeholder="Search staff..." class="searchInput" id="staffModalSearchInput" />
                <button class="searchBtn">
                    <img src="assets/icons/search-icon.png" alt="Search" />
                </button>
            </div>
            <div class="staffList" id="staffList"></div>
            <div class="modalButtons">
                <button class="modalBtn cancelBtn" id="cancelStaffBtn">CLOSE</button>
            </div>
        </div>
    </div>

    <!-- ADD/EDIT APPLIANCE MODAL -->
    <div class="modalBackdrop" id="addApplianceModal" style="display: none;">
        <div class="addItemModal">
            <button class="closeBtn" id="closeAddApplianceBtn">×</button>
            <div class="modalIconHeader">
                <i class="fas fa-tools" style="font-size: 48px; color: #FFA237;"></i>
            </div>
            <h2 id="addApplianceModalTitle">Add Appliance</h2>
            <p class="modalSubtext">Please fill out the appliance details carefully before submitting. Ensure that all information is accurate to help track maintenance and proper records.</p>
            
            <form id="addApplianceForm">
                <input type="hidden" id="applianceId" value="">
                <div class="formRow">
                    <div class="formGroup">
                        <label>Floor</label>
                        <select class="formInput" id="applianceFloor" required>
                            <option value="">Select Floor</option>
                        </select>
                    </div>
                    <div class="formGroup">
                        <label>Room</label>
                        <select class="formInput" id="applianceRoom" required>
                            <option value="">Select Room</option>
                        </select>
                    </div>
                </div>
                <div class="formRow">
                    <div class="formGroup">
                        <label>Appliance Name</label>
                        <input type="text" class="formInput" id="applianceName" placeholder="Enter appliance name" required>
                    </div>
                </div>
                <div class="formRow">
                    <div class="formGroup">
                        <label>Type</label>
                        <input type="text" class="formInput" id="applianceType" placeholder="Enter type (e.g., Electric, HVAC)" required>
                    </div>
                    <div class="formGroup">
                        <label>Installed Date</label>
                        <input type="date" class="formInput" id="applianceInstalledDate">
                    </div>
                </div>
                <div class="formRow">
                    <div class="formGroup">
                        <label>Last Maintained</label>
                        <input type="date" class="formInput" id="applianceLastMaintained">
                    </div>
                    <div class="formGroup">
                        <label>Status</label>
                        <select class="formInput" id="applianceStatus" required>
                            <option value="">Select Status</option>
                            <option value="Working">Working</option>
                            <option value="Needs Repair">Needs Repair</option>
                            <option value="Under Maintenance">Under Maintenance</option>
                            <option value="Out of Service">Out of Service</option>
                        </select>
                    </div>
                </div>
                <div class="formRow">
                    <div class="formGroup">
                        <label>Remarks</label>
                        <input type="text" class="formInput" id="applianceRemarks" placeholder="Enter remarks (optional)">
                    </div>
                </div>

                <div class="modalButtons">
                    <button type="button" class="modalBtn cancelBtn" id="cancelAddApplianceBtn">CANCEL</button>
                    <button type="submit" class="modalBtn confirmBtn" id="submitApplianceBtn">ADD APPLIANCE</button>
                </div>
            </form>
        </div>
    </div>

    <!-- CONFIRMATION MODAL -->
    <div class="modalBackdrop" id="confirmModal" style="display: none;">
        <div class="confirmModal">
            <h2 id="confirmModalTitle">Are you sure you want to add this appliance?</h2>
            <p class="modalSubtext" id="confirmModalText">Please review the details before confirming. Once added, the appliance will be recorded and visible in the maintenance records.</p>
            <div class="modalButtons">
                <button class="modalBtn cancelBtn" id="cancelConfirmBtn">CANCEL</button>
                <button class="modalBtn confirmBtn" id="confirmActionBtn">YES, ADD APPLIANCE</button>
            </div>
        </div>
    </div>

    <!-- SUCCESS MODAL -->
    <div class="modalBackdrop" id="successModal" style="display: none;">
        <div class="successModal">
            <button class="closeBtn" id="closeSuccessBtn">×</button>
            <div class="modalIconHeader">
                <i class="fas fa-check-circle" style="font-size: 80px; color: #28a745;"></i>
            </div>
            <h2 id="successModalMessage">Appliance Added Successfully</h2>
            <div class="modalButtons">
                <button class="modalBtn okayBtn" id="okaySuccessBtn">OKAY</button>
            </div>
        </div>
    </div>

    <!-- DELETE CONFIRMATION MODAL -->
    <div class="modalBackdrop" id="deleteModal" style="display: none;">
        <div class="confirmModal deleteConfirmModal">
            <button class="closeBtn" id="closeDeleteBtn">×</button>
            <div class="modalIconHeader">
                <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: #FFA237;"></i>
            </div>
            <h2>Are you sure you want to delete this appliance?</h2>
            <p class="modalSubtext">This action cannot be undone, and all related records will be permanently removed.</p>
            <div class="modalButtons">
                <button class="modalBtn cancelBtn" id="cancelDeleteBtn">CANCEL</button>
                <button class="modalBtn confirmBtn deleteBtn" id="confirmDeleteBtn">YES, DELETE</button>
            </div>
        </div>
    </div>

    <script>
        // Pass PHP data to JavaScript
        const initialRequestsData = <?php echo json_encode($roomsNeedingMaintenance); ?>;
        const availableStaffData = <?php echo json_encode($maintenanceStaff); ?>;
        const initialAppliancesData = <?php echo json_encode($appliancesData); ?>;
        const initialHistoryData = <?php echo json_encode($historyData); ?>;
        const allRoomsData = <?php echo json_encode($allRooms); ?>;
        const appliancesTypesData = <?php echo json_encode($appliancesTypes); ?>;
    </script>

    <script src="script/maintenance.js"></script>
</body>
</html>