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
require_once('user.php');
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


// ===== 4. Fetch ALL Rooms and their status (MODIFIED FOR SINGLE DB) =====
$allRoomsStatus = [];
$sql_rooms = "SELECT
                r.room_id as RoomID,
                r.floor_num as FloorNumber,
                r.room_num as RoomNumber,
                rs.LastMaintenance,
                
                -- Determine the most accurate current status
                CASE 
                    WHEN active_req.Status IS NOT NULL THEN active_req.Status
                    WHEN rs.RoomStatus = 'Maintenance' THEN 'Needs Maintenance'
                    ELSE COALESCE(rs.RoomStatus, 'Available') 
                END as RoomStatus,
                
                active_req.DateRequested as MaintenanceRequestDate,
                active_req.RequestID, 
                
                -- Get assigned staff member's name
                u.Fname,
                u.Lname,
                u.Mname
              FROM
                tbl_rooms r
              LEFT JOIN
                pms_room_status rs ON r.room_num = rs.RoomNumber
              LEFT JOIN (
                -- Subquery to find the *single* latest active request per room
                SELECT 
                    mr.RequestID,
                    mr.RoomID, 
                    mr.Status, 
                    mr.DateRequested, 
                    mr.AssignedUserID,
                    ROW_NUMBER() OVER(PARTITION BY mr.RoomID ORDER BY mr.DateRequested DESC) as rn
                FROM 
                    pms_maintenance_requests mr
                WHERE 
                    mr.Status IN ('Pending', 'In Progress')
              ) AS active_req ON active_req.RoomID = r.room_id AND active_req.rn = 1
              LEFT JOIN
                pms_users u ON u.UserID = active_req.AssignedUserID
              WHERE
                r.is_archived = 0
              ORDER BY
                r.floor_num, r.room_num ASC";

if ($result_rooms = $conn->query($sql_rooms)) {
    while ($row = $result_rooms->fetch_assoc()) {
        
        $requestDate = 'N/A';
        $requestTime = 'N/A';
        
        if (in_array($row['RoomStatus'], ['Needs Maintenance', 'Pending', 'In Progress']) && $row['MaintenanceRequestDate']) {
            $requestDate = formatDbDateForDisplay($row['MaintenanceRequestDate']);
            $requestTime = date('g:i A', strtotime($row['MaintenanceRequestDate']));
        }

        $staffName = 'Not Assigned';
        if (!empty($row['Fname'])) {
            $staffName = trim(
                htmlspecialchars($row['Fname']) .
                (empty($row['Mname']) ? '' : ' ' . strtoupper(substr(htmlspecialchars($row['Mname']), 0, 1)) . '.') .
                ' ' .
                htmlspecialchars($row['Lname'])
            );
        }

        $allRoomsStatus[] = [
            'id' => $row['RoomID'],
            'requestId' => $row['RequestID'],
            'floor' => $row['FloorNumber'],
            'room' => $row['RoomNumber'],
            'lastMaintenance' => formatDbDateTimeForDisplay($row['LastMaintenance']),
            'date' => $requestDate,
            'requestTime' => $requestTime,
            'status' => $row['RoomStatus'],
            'staff' => $staffName
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
                CASE 
                    WHEN u.AvailabilityStatus = 'Assigned' THEN 'Assigned'
                    WHEN a.attendance_id IS NOT NULL AND a.time_out IS NULL THEN 'Available'
                    ELSE 'Offline'
                END as AvailabilityStatus
              FROM 
                pms_users u
              JOIN 
                employees e ON u.EmployeeID = e.employee_code
              LEFT JOIN 
                attendance a ON e.employee_id = a.employee_id 
                AND a.time_out IS NULL 
                AND a.date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
              WHERE 
                u.AccountType = 'maintenance_staff' GROUP BY u.UserID" ; // <--- Specific to Maintenance

if ($result_staff = $conn->query($sql_staff)) {
    while ($row = $result_staff->fetch_assoc()) {
        
        $availability = $row['AvailabilityStatus'];

        // --- FILTER: Only show Available staff ---
        if ($availability !== 'Available') {
            continue; 
        }
        // -----------------------------------------

        $staffName = trim(
            htmlspecialchars($row['Fname']) .
            (empty($row['Mname']) ? '' : ' ' . strtoupper(substr(htmlspecialchars($row['Mname']), 0, 1)) . '.') .
            ' ' .
            htmlspecialchars($row['Lname'])
        );
        
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
// 6. Fetch all rooms for dropdowns (MODIFIED FOR SINGLE DB)
$allRooms = [];
$sql_all_rooms = "SELECT room_id, floor_num, room_num FROM tbl_rooms WHERE is_archived = 0 ORDER BY floor_num, room_num";
if ($result_all_rooms = $conn->query($sql_all_rooms)) {
    while ($row = $result_all_rooms->fetch_assoc()) {
        $allRooms[] = [
            'id' => $row['room_id'],
            'floor' => $row['floor_num'],
            'room' => $row['room_num']
        ];
    }
    $result_all_rooms->free();
}

// 7. Fetch History Data (MODIFIED FOR SINGLE DB)
$historyData = [];
$sql_history = "SELECT 
                    mr.RequestID, 
                    r.floor_num as FloorNumber, 
                    r.room_num as RoomNumber, 
                    mr.IssueType, 
                    mr.DateRequested, 
                    mr.DateCompleted, 
                    u.Fname, 
                    u.Lname, 
                    u.Mname, 
                    mr.Status, 
                    mr.Remarks 
                FROM 
                    pms_maintenance_requests mr 
                JOIN 
                    tbl_rooms r ON mr.RoomID = r.room_id
                LEFT JOIN 
                    pms_users u ON mr.AssignedUserID = u.UserID 
                WHERE 
                    mr.Status IN ('Completed', 'Cancelled', 'In Progress')
                ORDER BY 
                    -- 1. Primary Sort: Custom Status Priority
                    CASE 
                        WHEN mr.Status = 'In Progress' THEN 1
                        WHEN mr.Status = 'Completed'   THEN 2
                        WHEN mr.Status = 'Cancelled'   THEN 3
                    END ASC,
                    -- 2. Secondary Sort: By Date
                    mr.DateCompleted DESC,
                    mr.DateRequested DESC";

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
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    
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
        <p class="pageDescription">Monitor maintenance requests, assign technicians, and review completed repairs</p>

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
        
        <div style="display: flex; align-items: center; gap: 5px; background: white; border-radius: 5px; border: 1px solid #ddd; padding: 0 5px;">
            <input type="date" id="startDateFilterHistory" title="Start Date" style="border: none; outline: none; padding: 8px 5px; color: #480c1b; font-family: 'Segoe UI', sans-serif;">
            <span style="color: #666;">-</span>
            <input type="date" id="endDateFilterHistory" title="End Date" style="border: none; outline: none; padding: 8px 5px; color: #480c1b; font-family: 'Segoe UI', sans-serif;">
        </div>

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
        <div class="issueTypeModal">
            <button class="closeBtn" id="closeIssueTypeModalBtn">×</button>
            <h2>Select Issue Types</h2>
            <p class="modalSubtext">Select all relevant categories for the maintenance request in Room <strong id="issueTypeModalRoomNumber">---</strong>.</p>
            
            <form id="issueTypeForm">
                <input type="hidden" id="issueTypeRoomId" value="">
                
                <div class="issueTypeGrid">
                    <input type="checkbox" id="issue_select_all" class="issue-checkbox-hidden">
                    <label for="issue_select_all" class="issueTypeCard selectAllCard">
                        <div class="issueTypeName">SELECT ALL</div>
                        <div class="issueTypeCheck">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </label>

                    <input type="checkbox" id="issue_electrical" name="issueType[]" value="Electrical & Lighting" class="issue-checkbox-hidden">
                    <label for="issue_electrical" class="issueTypeCard">
                        <div class="issueTypeIcon">
                            <i class="fas fa-lightbulb"></i>
                        </div>
                        <div class="issueTypeName">Electrical & Lighting</div>
                        <div class="issueTypeCheck">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </label>

                    <input type="checkbox" id="issue_plumbing" name="issueType[]" value="Plumbing" class="issue-checkbox-hidden">
                    <label for="issue_plumbing" class="issueTypeCard">
                        <div class="issueTypeIcon">
                            <i class="fas fa-faucet"></i>
                        </div>
                        <div class="issueTypeName">Plumbing</div>
                        <div class="issueTypeCheck">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </label>

                    <input type="checkbox" id="issue_furniture" name="issueType[]" value="Furniture & Fixtures" class="issue-checkbox-hidden">
                    <label for="issue_furniture" class="issueTypeCard">
                        <div class="issueTypeIcon">
                            <i class="fas fa-couch"></i>
                        </div>
                        <div class="issueTypeName">Furniture & Fixtures</div>
                        <div class="issueTypeCheck">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </label>

                    <input type="checkbox" id="issue_hvac" name="issueType[]" value="HVAC" class="issue-checkbox-hidden">
                    <label for="issue_hvac" class="issueTypeCard">
                        <div class="issueTypeIcon">
                            <i class="fas fa-fan"></i>
                        </div>
                        <div class="issueTypeName">HVAC</div>
                        <div class="issueTypeCheck">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </label>

                    <input type="checkbox" id="issue_doors" name="issueType[]" value="Doors & Windows" class="issue-checkbox-hidden">
                    <label for="issue_doors" class="issueTypeCard">
                        <div class="issueTypeIcon">
                            <i class="fas fa-door-open"></i>
                        </div>
                        <div class="issueTypeName">Doors & Windows</div>
                        <div class="issueTypeCheck">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </label>

                    <input type="checkbox" id="issue_bathroom" name="issueType[]" value="Bathroom Area" class="issue-checkbox-hidden">
                    <label for="issue_bathroom" class="issueTypeCard">
                        <div class="issueTypeIcon">
                            <i class="fas fa-bath"></i>
                        </div>
                        <div class="issueTypeName">Bathroom Area</div>
                        <div class="issueTypeCheck">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </label>

                    <input type="checkbox" id="issue_safety" name="issueType[]" value="Safety & Security" class="issue-checkbox-hidden">
                    <label for="issue_safety" class="issueTypeCard">
                        <div class="issueTypeIcon">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <div class="issueTypeName">Safety & Security</div>
                        <div class="issueTypeCheck">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </label>

                    <input type="checkbox" id="issue_flooring" name="issueType[]" value="Flooring & Walls" class="issue-checkbox-hidden">
                    <label for="issue_flooring" class="issueTypeCard">
                        <div class="issueTypeIcon">
                            <i class="fas fa-paint-roller"></i>
                        </div>
                        <div class="issueTypeName">Flooring & Walls</div>
                        <div class="issueTypeCheck">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </label>

                    <input type="checkbox" id="issue_windows" name="issueType[]" value="Windows, Curtains, & Blinds" class="issue-checkbox-hidden">
                    <label for="issue_windows" class="issueTypeCard">
                        <div class="issueTypeIcon">
                            <i class="fas fa-window-maximize"></i>
                        </div>
                        <div class="issueTypeName">Windows, Curtains, & Blinds</div>
                        <div class="issueTypeCheck">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </label>
                </div>
                
                <div class="modalButtons">
                    <button type="button" class="modalBtn cancelBtn" id="cancelIssueTypeBtn">CANCEL</button>
                    <button type="submit" class="modalBtn confirmBtn" id="confirmIssueTypeBtn">
                        <i class="fas fa-check"></i> NEXT
                    </button>
                </div>
            </form>
        </div>
    </div>

    <div class="modalBackdrop" id="editRoomStatusModal" style="display: none;">
        <div class="addItemModal"> <button class="closeBtn" id="closeEditRoomStatusBtn">×</button>
            <div class="modalIconHeader">
                <i class="fas fa-bed" style="font-size: 48px; color: #480c1b;"></i>
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
                <i class="fas fa-check-circle" style="font-size: 80px; color: #480c1b;"></i>
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

    <script src="script/download-utils.js?v=<?php echo time(); ?>"></script>
    <script src="script/maintenance.pagination.js?v=<?php echo time(); ?>"></script>
<script src="script/maintenance.utils.js?v=<?php echo time(); ?>"></script>
<script src="script/maintenance.ui.js?v=<?php echo time(); ?>"></script>
<script src="script/maintenance.requests.js?v=<?php echo time(); ?>"></script>
<script src="script/maintenance.history.js?v=<?php echo time(); ?>"></script>
<script src="script/maintenance.js?v=<?php echo time(); ?>"></script>

    </body>
</html>