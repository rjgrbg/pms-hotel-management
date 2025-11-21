<?php
// 1. Cache Control Headers
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// 2. Check Login Status and Role
// check_session.php already includes session_start()
include('check_session.php');
// *** MODIFIED: Only allow housekeeping_manager ***
require_login(['housekeeping_manager']);

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
                rs.LastClean,
                
                -- Determine the most accurate current status
                CASE 
                    WHEN active_task.Status IS NOT NULL THEN active_task.Status
                    WHEN rs.RoomStatus = 'Needs Cleaning' THEN 'Needs Cleaning'
                    ELSE COALESCE(rs.RoomStatus, 'Available') 
                END as RoomStatus,
                
                active_task.DateRequested as TaskRequestDate,
                active_task.TaskID, 
                
                -- Get assigned staff member's name
                u.Fname,
                u.Lname,
                u.Mname
              FROM
                tbl_rooms r
              LEFT JOIN
                pms_room_status rs ON r.room_num = rs.RoomNumber
              LEFT JOIN (
                -- Subquery to find the *single* latest active task per room
                SELECT 
                    ht.TaskID,
                    ht.RoomID, 
                    ht.Status, 
                    ht.DateRequested, 
                    ht.AssignedUserID,
                    ROW_NUMBER() OVER(PARTITION BY ht.RoomID ORDER BY ht.DateRequested DESC) as rn
                FROM 
                    pms_housekeeping_tasks ht
                WHERE 
                    ht.Status IN ('Pending', 'In Progress')
              ) AS active_task ON active_task.RoomID = r.room_id AND active_task.rn = 1
              LEFT JOIN
                pms_users u ON u.UserID = active_task.AssignedUserID
              WHERE
                r.is_archived = 0
              ORDER BY
                r.floor_num, r.room_num ASC";

if ($result_rooms = $conn->query($sql_rooms)) {
    while ($row = $result_rooms->fetch_assoc()) {
        
        $requestDate = 'N/A';
        $requestTime = 'N/A';
        
        if (in_array($row['RoomStatus'], ['Needs Cleaning', 'Pending', 'In Progress']) && $row['TaskRequestDate']) {
            $requestDate = formatDbDateForDisplay($row['TaskRequestDate']);
            $requestTime = date('g:i A', strtotime($row['TaskRequestDate']));
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
            'taskId' => $row['TaskID'],
            'floor' => $row['FloorNumber'],
            'room' => $row['RoomNumber'],
            'lastClean' => formatDbDateTimeForDisplay($row['LastClean']),
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

// 5. Fetch Housekeeping Staff (UNCHANGED)
$housekeepingStaff = [];
$sql_staff = "SELECT 
                u.UserID, 
                u.Fname, 
                u.Lname, 
                u.Mname,
                CASE 
                    -- 1. If they are already assigned to a room in PMS, keep status as 'Assigned'
                    WHEN u.AvailabilityStatus = 'Assigned' THEN 'Assigned'
                    
                    -- 2. If they have a valid clock-in today (and no clock-out), they are 'Available'
                    WHEN a.attendance_id IS NOT NULL AND a.time_out IS NULL THEN 'Available'
                    
                    -- 3. Otherwise, they are 'Offline'
                    ELSE 'Offline'
                END as AvailabilityStatus
              FROM 
                pms_users u
              -- Join Employees to link User to Employee Record
              JOIN 
                employees e ON u.EmployeeID = e.employee_code
              -- Join Attendance to check if that employee is clocked in TODAY
           LEFT JOIN 
    attendance a ON e.employee_id = a.employee_id 
    AND a.time_out IS NULL 
    AND a.date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
              WHERE 
                u.AccountType = 'housekeeping_staff'";

if ($result_staff = $conn->query($sql_staff)) {
    while ($row = $result_staff->fetch_assoc()) {
        $staffName = trim(
            htmlspecialchars($row['Fname']) .
            (empty($row['Mname']) ? '' : ' ' . strtoupper(substr(htmlspecialchars($row['Mname']), 0, 1)) . '.') .
            ' ' .
            htmlspecialchars($row['Lname'])
        );
        
        $availability = $row['AvailabilityStatus'];

        $housekeepingStaff[] = [
            'id' => $row['UserID'],
            'name' => $staffName,
            'availability' => $availability 
        ];
    }
    $result_staff->free();
} else {
    error_log("Error fetching housekeeping staff: ". $conn->error);
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
                    ht.TaskID, 
                    r.floor_num as FloorNumber, 
                    r.room_num as RoomNumber, 
                    ht.TaskType,
                    ht.DateRequested, 
                    ht.DateCompleted, 
                    u.Fname, 
                    u.Lname, 
                    u.Mname, 
                    ht.Status, 
                    ht.Remarks 
                FROM 
                    pms_housekeeping_tasks ht
                JOIN 
                    tbl_rooms r ON ht.RoomID = r.room_id
                LEFT JOIN 
                    pms_users u ON ht.AssignedUserID = u.UserID 
               WHERE 
                    ht.Status IN ('In Progress', 'Completed', 'Cancelled')
                ORDER BY 
                    -- 1. Primary Sort: Custom Status Priority
                    CASE 
                        WHEN ht.Status = 'In Progress' THEN 1
                        WHEN ht.Status = 'Completed'   THEN 2
                        WHEN ht.Status = 'Cancelled'   THEN 3
                    END ASC,
                    -- 2. Secondary Sort: By Date
                    ht.DateCompleted DESC,
                    ht.DateRequested DESC";
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
            'id' => $row['TaskID'],
            'floor' => $row['FloorNumber'],
            'room' => $row['RoomNumber'],
            'issueType' => $row['TaskType'],
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
    error_log("Error fetching housekeeping history: " . $conn->error);
}

// 8. Close database connection
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
                            <th>Last Clean</th>
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
                            <th>Task</th>
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
            <p class="modalSubtext">Showing available Housekeeping Staff</p>
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

    <div class="modalBackdrop" id="taskTypeModal" style="display: none;">
        <div class="addItemModal">
            <button class="closeBtn" id="closeTaskTypeModalBtn">×</button>
            <div class="modalIconHeader">
                <i class="fas fa-broom" style="font-size: 48px; color: #FFA237;"></i>
            </div>
            <h2>Select Task Types</h2>
            <p class="modalSubtext">Select all relevant tasks for the request in Room <strong id="taskTypeModalRoomNumber">---</strong>.</p>
            
            <form id="taskTypeForm">
                <input type="hidden" id="taskTypeRoomId" value="">
                
                <div class="formGroup checkboxGroup" style="width: 100%; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 10px;">
                    <input type="checkbox" id="task_select_all">
                    <label for="task_select_all" style="font-weight: 700; color: #333;">SELECT ALL</label>
                </div>

                <div class="formRow" id="taskTypeCheckboxContainer" style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px 15px; max-height: 250px; overflow-y: auto;">
                    <div class="formGroup checkboxGroup">
                        <input type="checkbox" id="task_general" name="taskType[]" value="General Cleaning">
                        <label for="task_general">General Cleaning</label>
                    </div>
                    <div class="formGroup checkboxGroup">
                        <input type="checkbox" id="task_linen" name="taskType[]" value="Bed and Linen Care">
                        <label for="task_linen">Bed and Linen Care</label>
                    </div>
                    <div class="formGroup checkboxGroup">
                        <input type="checkbox" id="task_bathroom" name="taskType[]" value="Bathroom Cleaning">
                        <label for="task_bathroom">Bathroom Cleaning</label>
                    </div>
                    <div class="formGroup checkboxGroup">
                        <input type="checkbox" id="task_restock" name="taskType[]" value="Restocking Supplies">
                        <label for="task_restock">Restocking Supplies</label>
                    </div>
                    <div class="formGroup checkboxGroup">
                        <input type="checkbox" id="task_trash" name="taskType[]" value="Trash Removal">
                        <label for="task_trash">Trash Removal</label>
                    </div>
                    <div class="formGroup checkboxGroup">
                        <input type="checkbox" id="task_windows" name="taskType[]" value="Window & Curtains Care">
                        <label for="task_windows">Window & Curtains Care</label>
                    </div>
                </div>
                
                <div class="modalButtons">
                    <button type="button" class="modalBtn cancelBtn" id="cancelTaskTypeBtn">CANCEL</button>
                    <button type="submit" class="modalBtn confirmBtn" id="confirmTaskTypeBtn">NEXT</button>
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
                            <option value="Needs Cleaning">Needs Cleaning</option>
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
        // *** MODIFIED: Variable name ***
        const availableStaffData = <?php echo json_encode($housekeepingStaff); ?>;
        const initialHistoryData = <?php echo json_encode($historyData); ?>;
        const allRoomsData = <?php echo json_encode($allRooms); ?>;
    </script>

    <script src="script/housekeeping.pagination.js?v=<?php echo time(); ?>"></script>
    <script src="script/housekeeping.utils.js?v=<?php echo time(); ?>"></script>
    <script src="script/housekeeping.ui.js?v=<?php echo time(); ?>"></script>
    <script src="script/housekeeping.requests.js?v=<?php echo time(); ?>"></script>
    <script src="script/housekeeping.history.js?v=<?php echo time(); ?>"></script>
    <script src="script/housekeeping.js?v=<?php echo time(); ?>"></script>

    </body>
</html>