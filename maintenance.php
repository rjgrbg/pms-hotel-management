<?php
// 1. Cache Control Headers
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// 2. Check Login Status and Role
// check_session.php already includes session_start()
include('check_session.php');
require_login(['maintenance_manager']);

// 3. Load database and user data
require_once('db_connection.php');
require_once('User.php');
$userData = getUserData($conn);
$Fname = htmlspecialchars($userData['Name']);
$Accounttype = htmlspecialchars($userData['Accounttype']);

// ===== HELPER FUNCTIONS FOR DATE FORMATTING =====
function formatDbDateForDisplay($date) {
    if (!$date) return 'N/A';
    try {
        return date('m.d.Y', strtotime($date));
    } catch (Exception $e) {
        return 'N/A';
    }
}

function formatDbDateTimeForDisplay($datetime) {
    if (!$datetime) return 'Never';
    try {
        return date('g:iA/m.d.Y', strtotime($datetime));
    } catch (Exception $e) {
        return 'Never';
    }
}
// ===== END OF HELPER FUNCTIONS =====


// 4. Fetch ALL Rooms and their status
$allRoomsStatus = [];
// --- UPDATED: Added 'pms.' prefix to the maintenance_requests subquery ---
$sql_rooms = "SELECT
                r.RoomID,
                r.FloorNumber,
                r.RoomNumber,
                CASE 
                    WHEN rs.RoomStatus = 'Maintenance' THEN 'Needs Maintenance'
                    ELSE COALESCE(rs.RoomStatus, 'Available') 
                END as RoomStatus,
                rs.LastMaintenance,
                --
                -- FIXED: Added 'pms.' prefix here
                --
                (SELECT mr.DateRequested FROM pms.maintenance_requests mr
                 WHERE mr.RoomID = r.RoomID AND mr.Status IN ('Pending', 'In Progress')
                 ORDER BY mr.DateRequested DESC LIMIT 1) as MaintenanceRequestDate
              FROM
                crm.rooms r
              LEFT JOIN
                pms.room_status rs ON r.RoomNumber = rs.RoomNumber
              ORDER BY
                r.FloorNumber, r.RoomNumber ASC";

if ($result_rooms = $conn->query($sql_rooms)) {
    while ($row = $result_rooms->fetch_assoc()) {
        
        $requestDate = 'N/A';
        $requestTime = 'N/A';
        
        // This 'if' block will now work correctly because $row['MaintenanceRequestDate'] will be filled
        if (in_array($row['RoomStatus'], ['Needs Maintenance', 'Pending', 'In Progress']) && $row['MaintenanceRequestDate']) {
            $requestDate = formatDbDateForDisplay($row['MaintenanceRequestDate']);
            $requestTime = date('g:i A', strtotime($row['MaintenanceRequestDate']));
        }

        $allRoomsStatus[] = [
            'id' => $row['RoomID'], // This is the RoomID from CRM
            'floor' => $row['FloorNumber'],
            'room' => $row['RoomNumber'],
            'lastMaintenance' => formatDbDateTimeForDisplay($row['LastMaintenance']),
            'date' => $requestDate,
            'requestTime' => $requestTime,
            'status' => $row['RoomStatus'],
            'staff' => 'Not Assigned'
        ];
    }
    $result_rooms->free();
} else {
    error_log("Error fetching all room statuses: " . $conn->error);
}

// 5. Fetch Maintenance Staff
$maintenanceStaff = [];
// --- UPDATED: Read the new AvailabilityStatus column from pms.users ---
$sql_staff = "SELECT 
                u.UserID, 
                u.Fname, 
                u.Lname, 
                u.Mname,
                u.AvailabilityStatus
              FROM 
                pms.users u
              WHERE 
                u.AccountType = 'maintenance_staff'";

if ($result_staff = $conn->query($sql_staff)) {
    while ($row = $result_staff->fetch_assoc()) {
        $staffName = trim(
            htmlspecialchars($row['Fname']) .
            (empty($row['Mname']) ? '' : ' ' . strtoupper(substr(htmlspecialchars($row['Mname']), 0, 1)) . '.') .
            ' ' .
            htmlspecialchars($row['Lname'])
        );
        
        // The availability now comes directly from the database
        $availability = $row['AvailabilityStatus']; // e.g., 'Available', 'Assigned', 'Offline'

        $maintenanceStaff[] = [
            'id' => $row['UserID'],
            'name' => $staffName,
            'availability' => $availability 
        ];
    }
    $result_staff->free();
} else {
    error_log("Error fetching maintenance staff: ". $conn->error);
}
// 6. Fetch Appliances Types
$appliancesTypes = [];
$sql_types = "SELECT DISTINCT ApplianceType FROM pms.room_appliances WHERE ApplianceType IS NOT NULL AND ApplianceType != '' ORDER BY ApplianceType";
if ($result_types = $conn->query($sql_types)) {
    while ($row = $result_types->fetch_assoc()) {
        $appliancesTypes[] = $row['ApplianceType'];
    }
    $result_types->free();
}

// 7. Fetch all rooms for dropdowns
$allRooms = [];
// --- UPDATED: Fetch from crm.rooms (master list) ---
$sql_all_rooms = "SELECT RoomID, FloorNumber, RoomNumber FROM crm.rooms ORDER BY FloorNumber, RoomNumber";
if ($result_all_rooms = $conn->query($sql_all_rooms)) {
    while ($row = $result_all_rooms->fetch_assoc()) {
        $allRooms[] = [
            'id' => $row['RoomID'], // This is the RoomID from CRM
            'floor' => $row['FloorNumber'],
            'room' => $row['RoomNumber']
        ];
    }
    $result_all_rooms->free();
}

// 8. Fetch Appliances
$appliancesData = [];
// --- UPDATED: JOIN pms.room_appliances with crm.rooms ---
$sql_appliances = "SELECT 
                        ra.ApplianceID, 
                        ra.RoomID, 
                        r.FloorNumber, 
                        r.RoomNumber, 
                        ra.InstalledDate, 
                        ra.ApplianceType, 
                        ra.ApplianceName, 
                        ra.Manufacturer, 
                        ra.ModelNumber, 
                        ra.LastMaintainedDate, 
                        ra.Status, 
                        ra.Remarks 
                   FROM 
                        pms.room_appliances ra
                   JOIN 
                        crm.rooms r ON ra.RoomID = r.RoomID
                   ORDER BY 
                        r.FloorNumber, r.RoomNumber, ra.ApplianceName";

if ($result_appliances = $conn->query($sql_appliances)) {
    while ($row = $result_appliances->fetch_assoc()) {
        $appliancesData[] = [
            'id' => $row['ApplianceID'],
            'roomId' => $row['RoomID'], // CRM RoomID
            'floor' => $row['FloorNumber'],
            'room' => $row['RoomNumber'],
            'installedDate' => formatDbDateForDisplay($row['InstalledDate']),
            'type' => $row['ApplianceType'],
            'item' => $row['ApplianceName'],
            'manufacturer' => $row['Manufacturer'],
            'modelNumber' => $row['ModelNumber'],
            'lastMaintained' => formatDbDateTimeForDisplay($row['LastMaintainedDate']),
            'status' => $row['Status'],
            'remarks' => $row['Remarks']
        ];
    }
    $result_appliances->free();
} else {
    error_log("Error fetching appliances: " . $conn->error);
}


// 9. Fetch History Data
$historyData = [];
// --- UPDATED: JOIN pms.maintenance_requests with crm.rooms ---
$sql_history = "SELECT 
                    mr.RequestID, 
                    r.FloorNumber, 
                    r.RoomNumber, 
                    mr.IssueType, 
                    mr.DateRequested, 
                    mr.DateCompleted, 
                    u.Fname, 
                    u.Lname, 
                    u.Mname, 
                    mr.Status, 
                    mr.Notes 
                FROM 
                    pms.maintenance_requests mr 
                JOIN 
                    crm.rooms r ON mr.RoomID = r.RoomID 
                LEFT JOIN 
                    pms.users u ON mr.AssignedUserID = u.UserID 
                WHERE 
                    mr.Status IN ('Completed', 'Cancelled')
                ORDER BY 
                    mr.DateCompleted DESC";

if ($result_history = $conn->query($sql_history)) {
    while ($row = $result_history->fetch_assoc()) {
        $staffName = 'N/A';
        if ($row['Fname']) {
            $staffName = trim(
                htmlspecialchars($row['Fname']) .
                (empty($row['Mname']) ? '' : ' ' . strtoupper(substr(htmlspecialchars($row['Mname']), 0, 1)) . '.') .
                ' ' .
                htmlspecialchars($row['Lname'])
            );
        }
        
        $historyData[] = [
            'id' => $row['RequestID'],
            'floor' => $row['FloorNumber'],
            'room' => $row['RoomNumber'],
            'issueType' => $row['IssueType'],
            'date' => formatDbDateForDisplay($row['DateRequested']),
            'requestedTime' => date('g:i A', strtotime($row['DateRequested'])),
            'completedTime' => $row['DateCompleted'] ? date('g:i A', strtotime($row['DateCompleted'])) : 'N/A',
            'staff' => $staffName,
            'status' => $row['Status'],
            'remarks' => $row['Notes']
        ];
    }
    $result_history->free();
} else {
    error_log("Error fetching maintenance history: " . $conn->error);
}

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
                <p><?php echo ucfirst(str_replace('_', ' ', $Accounttype)); ?></p>
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
        <h1 class="pageTitle">MAINTENANCE</h1>

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

        <div class="tabContent" id="history-tab">
            <div class="controlsRow">
                <div class="filterControls">
                    <select class="filterDropdown" id="floorFilterHistory">
                        <option value="">Floor</option>
                    </select>
                    <select class="filterDropdown" id="roomFilterHistory">
                        <option value="">Room</option>
                    </select>
                    <input type="date" class="filterDropdown" id="dateFilterHistory" style="width: 150px; padding: 8px 14px;">
                    
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
    <button class="modalBtn cancelBtn" id="cancelStaffBtn">CANCEL</button>
    <button class="modalBtn confirmBtn" id="confirmStaffAssignBtn" disabled>ASSIGN STAFF</button>
</div>
        </div>
    </div>

    <div class="modalBackdrop" id="addApplianceModal" style="display: none;">
        <div class="addItemModal">
            <button class="closeBtn" id="closeAddApplianceBtn">×</button>
            <div class="modalIconHeader">
                <i class="fas fa-tools" style="font-size: 48px; color: #FFA237;"></i>
            </div>
            <h2 id="addApplianceModalTitle">Add Appliance</h2>
            <p class="modalSubtext" id="addApplianceModalSubtext">Please fill out the appliance details carefully before submitting. Ensure that all information is accurate to help track maintenance and proper records.</p>
            
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
                     <div class="formGroup">
                        <label>Type</label>
                        <select class="formInput" id="applianceType" required>
                            <option value="">Select Type</option>
                            <option value="Electric">Electric</option>
                            <option value="HVAC">HVAC</option>
                            <option value="Water System">Water System</option>
                        </select>
                    </div>
                </div>
                <div class="formRow">
                    <div class="formGroup">
                        <label>Manufacturer</label>
                        <input type="text" class="formInput" id="applianceManufacturer" placeholder="Enter manufacturer" required>
                    </div>
                    <div class="formGroup">
                        <label>Model Number</label>
                        <input type="text" class="formInput" id="applianceModelNumber" placeholder="Enter model number" required>
                    </div>
                </div>
                <div class="formRow">
                    <div class="formGroup">
                        <label>Installed Date</label>
                        <input type="date" class="formInput" id="applianceInstalledDate" required>
                    </div>
                </div>
                
                <div class="formRow" id="formGroup-status" style="display: none;">
                    <div class="formGroup">
                        <label>Status</label>
                        <select class="formInput" id="applianceStatus">
                            <option value="Working">Working</option>
                            <option value="Needs Repair">Needs Repair</option>
                            <option value="Under Maintenance">Under Maintenance</option>
                            <option value="Out of Service">Out of Service</option>
                        </select>
                    </div>
                </div>
                <div class="formRow" id="formGroup-remarks" style="display: none;">
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

    <div class="modalBackdrop" id="confirmModal" style="display: none;">
        <div class="confirmModal">
            <h2 id="confirmModalTitle">Are you sure?</h2>
            <p class="modalSubtext" id="confirmModalText">Please review the details before confirming.</p>
            <div class="modalButtons">
                <button class="modalBtn cancelBtn" id="cancelConfirmBtn">CANCEL</button>
                <button class="modalBtn confirmBtn" id="confirmActionBtn">YES, CONFIRM</button>
            </div>
        </div>
    </div>

    <div class="modalBackdrop" id="successModal" style="display: none;">
        <div class="successModal">
            <button class="closeBtn" id="closeSuccessBtn">×</button>
            <div class="modalIconHeader">
                <i class="fas fa-check-circle" style="font-size: 80px; color: #28a745;"></i>
            </div>
            <h2 id="successModalMessage">Success!</h2>
            <div class="modalButtons">
                <button class="modalBtn okayBtn" id="okaySuccessBtn">OKAY</button>
            </div>
        </div>
    </div>

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
        const initialRequestsData = <?php echo json_encode($allRoomsStatus); ?>;
        const availableStaffData = <?php echo json_encode($maintenanceStaff); ?>;
        const initialAppliancesData = <?php echo json_encode($appliancesData); ?>;
        const initialHistoryData = <?php echo json_encode($historyData); ?>;
        const allRoomsData = <?php echo json_encode($allRooms); ?>;
        const appliancesTypesData = <?php echo json_encode($appliancesTypes); ?>;
    </script>

    <script src="script/maintenance.js?v=4"></script>
</body>
</html>