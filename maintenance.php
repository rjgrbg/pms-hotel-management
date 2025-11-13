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


// ===== 4. Fetch ALL Rooms and their status (MODIFIED) =====
$allRoomsStatus = [];
// --- This query joins maintenance_requests and users
// --- to get the *correct* current status and assigned staff name ---
$sql_rooms = "SELECT
                r.RoomID,
                r.FloorNumber,
                r.RoomNumber,
                rs.LastMaintenance,
                
                -- Determine the most accurate current status
                CASE 
                    WHEN active_req.Status IS NOT NULL THEN active_req.Status -- 'Pending' or 'In Progress'
                    WHEN rs.RoomStatus = 'Maintenance' THEN 'Needs Maintenance'
                    ELSE COALESCE(rs.RoomStatus, 'Available') 
                END as RoomStatus,
                
                active_req.DateRequested as MaintenanceRequestDate,
                
                -- *** ADDED: Get RequestID ***
                active_req.RequestID, 
                
                -- Get assigned staff member's name
                u.Fname,
                u.Lname,
                u.Mname
              FROM
                crm.rooms r
              LEFT JOIN
                pms.room_status rs ON r.RoomNumber = rs.RoomNumber
              LEFT JOIN (
                -- Subquery to find the *single* latest active request per room
                SELECT 
                    mr.RequestID, -- *** Added RequestID ***
                    mr.RoomID, 
                    mr.Status, 
                    mr.DateRequested, 
                    mr.AssignedUserID,
                    ROW_NUMBER() OVER(PARTITION BY mr.RoomID ORDER BY mr.DateRequested DESC) as rn
                FROM 
                    pms.maintenance_requests mr
                WHERE 
                    mr.Status IN ('Pending', 'In Progress')
              ) AS active_req ON active_req.RoomID = r.RoomID AND active_req.rn = 1
              LEFT JOIN
                -- Join users table to get the staff name
                pms.users u ON u.UserID = active_req.AssignedUserID
              ORDER BY
                r.FloorNumber, r.RoomNumber ASC";

if ($result_rooms = $conn->query($sql_rooms)) {
    while ($row = $result_rooms->fetch_assoc()) {
        
        $requestDate = 'N/A';
        $requestTime = 'N/A';
        
        if (in_array($row['RoomStatus'], ['Needs Maintenance', 'Pending', 'In Progress']) && $row['MaintenanceRequestDate']) {
            $requestDate = formatDbDateForDisplay($row['MaintenanceRequestDate']);
            $requestTime = date('g:i A', strtotime($row['MaintenanceRequestDate']));
        }

        // --- NEW STAFF NAME LOGIC (MODIFIED) ---
        $staffName = 'Not Assigned';
        if (!empty($row['Fname'])) {
            $staffName = trim(
                htmlspecialchars($row['Fname']) .
                (empty($row['Mname']) ? '' : ' ' . strtoupper(substr(htmlspecialchars($row['Mname']), 0, 1)) . '.') .
                ' ' .
                htmlspecialchars($row['Lname'])
            );
        }
        // --- END NEW STAFF NAME LOGIC ---

        $allRoomsStatus[] = [
            'id' => $row['RoomID'], // This is the RoomID from CRM
            'requestId' => $row['RequestID'], // *** ADDED RequestID ***
            'floor' => $row['FloorNumber'],
            'room' => $row['RoomNumber'],
            'lastMaintenance' => formatDbDateTimeForDisplay($row['LastMaintenance']),
            'date' => $requestDate,
            'requestTime' => $requestTime,
            'status' => $row['RoomStatus'], // This now correctly gets 'Pending'
            'staff' => $staffName           // This now correctly gets the name
        ];
    }
    $result_rooms->free();
} else {
    error_log("Error fetching all room statuses: " . $conn->error);
}

// 5. Fetch Maintenance Staff
$maintenanceStaff = [];
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

// 6. Fetch all rooms for dropdowns
$allRooms = [];
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

// 7. Fetch History Data
$historyData = [];
// *** MODIFIED: Added mr.Remarks back to SELECT ***
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
                    mr.Remarks 
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
            // *** ADDED: 'remarks' key is back ***
            'remarks' => $row['Remarks']
        ];
    }
    $result_history->free();
} else {
    error_log("Error fetching maintenance history: " . $conn->error);
}

// 8. Close database connection
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

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js"></script>
    
    <style>
        /* This style block is new and required */

        /* By default, hide the error message paragraph */
        #editRoomStatusModal .modalSubtext.error-message {
            display: none;
            color: #d9534f; /* Red color for error */
            font-weight: 500;
            margin-bottom: 25px;
        }

        /* When the modal has the 'error-view' class... */
        
        /* 1. HIDE the normal form elements */
        #editRoomStatusModal.error-view #editRoomStatusForm .formRow,
        #editRoomStatusModal.error-view #submitEditRoomStatusBtn {
            display: none;
        }

        /* 2. HIDE the normal subtext */
        #editRoomStatusModal.error-view .modalSubtext.normal-message {
            display: none;
        }

        /* 3. SHOW the error message */
        #editRoomStatusModal.error-view .modalSubtext.error-message {
            display: block;
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
                            <th>ACTIONS</th> </tr>
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
                            <th>Type</th>
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

    <div class="modalBackdrop" id="issueTypeModal" style="display: none;">
        <div class="addItemModal">
            <button class="closeBtn" id="closeIssueTypeModalBtn">×</button>
            <div class="modalIconHeader">
                <i class="fas fa-tasks" style="font-size: 48px; color: #FFA237;"></i>
            </div>
            <h2>Select Issue Types</h2>
            <p class="modalSubtext">Select all relevant categories for the maintenance request in Room <strong id="issueTypeModalRoomNumber">---</strong>.</p>
            
            <form id="issueTypeForm">
                <input type="hidden" id="issueTypeRoomId" value="">
                
                <div class="formGroup checkboxGroup" style="width: 100%; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 10px;">
                    <input type="checkbox" id="issue_select_all" name="issue_select_all">
                    <label for="issue_select_all" style="font-weight: 700; color: #333;">SELECT ALL</label>
                </div>

                <div class="formRow" id="issueTypeCheckboxContainer" style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px 15px; max-height: 250px; overflow-y: auto;">
                    <div class="formGroup checkboxGroup">
                        <input type="checkbox" id="issue_electrical" name="issueType[]" value="Electrical & Lighting">
                        <label for="issue_electrical">Electrical & Lighting</label>
                    </div>
                    <div class="formGroup checkboxGroup">
                        <input type="checkbox" id="issue_plumbing" name="issueType[]" value="Plumbing">
                        <label for="issue_plumbing">Plumbing</label>
                    </div>
                    <div class="formGroup checkboxGroup">
                        <input type="checkbox" id="issue_furniture" name="issueType[]" value="Furniture & Fixtures">
                        <label for="issue_furniture">Furniture & Fixtures</label>
                    </div>
                    <div class="formGroup checkboxGroup">
                        <input type="checkbox" id="issue_hvac" name="issueType[]" value="HVAC">
                        <label for="issue_hvac">HVAC</label>
                    </div>
                    <div class="formGroup checkboxGroup">
                        <input type="checkbox" id="issue_doors" name="issueType[]" value="Doors & Windows">
                        <label for="issue_doors">Doors & Windows</label>
                    </div>
                    <div class="formGroup checkboxGroup">
                        <input type="checkbox" id="issue_bathroom" name="issueType[]" value="Bathroom Area">
                        <label for="issue_bathroom">Bathroom Area</label>
                    </div>
                    <div class="formGroup checkboxGroup">
                        <input type="checkbox" id="issue_safety" name="issueType[]" value="Safety & Security">
                        <label for="issue_safety">Safety & Security</label>
                    </div>
                    <div class="formGroup checkboxGroup">
                        <input type="checkbox" id="issue_flooring" name="issueType[]" value="Flooring & Walls">
                        <label for="issue_flooring">Flooring & Walls</label>
                    </div>
                    <div class="formGroup checkboxGroup">
                        <input type="checkbox" id="issue_windows" name="issueType[]" value="Windows, Curtains, & Blinds">
                        <label for="issue_windows">Windows, Curtains, & Blinds</label>
                    </div>
                </div>
                
                <div class="modalButtons">
                    <button type="button" class="modalBtn cancelBtn" id="cancelIssueTypeBtn">CANCEL</button>
                    <button type="submit" class="modalBtn confirmBtn" id="confirmIssueTypeBtn">NEXT</button>
                </div>
            </form>
        </div>
    </div>

    <div class="modalBackdrop" id="editRoomStatusModal" style="display: none;">
        <div class="addItemModal"> <button class="closeBtn" id="closeEditRoomStatusBtn">×</button>
            <div class="modalIconHeader">
                <i class="fas fa-bed" style="font-size: 48px; color: #FFA237;"></i>
            </div>
            <h2 id="editRoomStatusModalTitle">Edit Room Status</h2>
            
            <p class="modalSubtext normal-message">
                Update the status for Room <strong id="editRoomStatusRoomNumber">---</strong>.
            </p>
            <p class="modalSubtext error-message" id="editRoomStatusErrorMessage">
                </p>
            <form id="editRoomStatusForm">
                <input type="hidden" id="editRoomStatusRoomId" value="">
                <div class="formRow">
                    <div class="formGroup">
                        <label>Room Status</label>
                        <select class="formInput" id="editRoomStatusSelect" required>
                            <option value="Available">Available</option>
                            <option value="Needs Maintenance">Needs Maintenance</option>
                        </select>
                    </div>
                </div>
                <div class="modalButtons">
                    <button type="button" class="modalBtn cancelBtn" id="cancelEditRoomStatusBtn">CANCEL</button>
                    <button type="submit" class="modalBtn confirmBtn" id="submitEditRoomStatusBtn">UPDATE STATUS</button>
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

    <script>
        // Pass PHP data to JavaScript as global variables
        const initialRequestsData = <?php echo json_encode($allRoomsStatus); ?>;
        const availableStaffData = <?php echo json_encode($maintenanceStaff); ?>;
        // REMOVED initialHotelAssetsData
        const initialHistoryData = <?php echo json_encode($historyData); ?>;
        const allRoomsData = <?php echo json_encode($allRooms); ?>;
        // REMOVED hotelAssetsTypesData
    </script>

    <script src="script/maintenance.pagination.js?v=<?php echo time(); ?>"></script>
<script src="script/maintenance.utils.js?v=<?php echo time(); ?>"></script>
<script src="script/maintenance.ui.js?v=<?php echo time(); ?>"></script>
<script src="script/maintenance.requests.js?v=<?php echo time(); ?>"></script>
<script src="script/maintenance.history.js?v=<?php echo time(); ?>"></script>
<script src="script/maintenance.js?v=<?php echo time(); ?>"></script>

    </body>
</html>