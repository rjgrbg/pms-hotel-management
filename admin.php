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
  $sql = "SELECT Fname, Mname, Lname, AccountType FROM pms_users WHERE UserID = ?";

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
          if (!empty(trim($formattedName))) { // Add space only if Fname or Mname was present
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
  // DO NOT CLOSE $conn HERE, we need it for other queries
} else {
  error_log("UserID not found in session for admin.php");
}
// --- End Fetch User Data ---

// ===== HELPER FUNCTIONS FOR DATE FORMATTING =====
function formatDbDateForDisplay($date)
{
  if (!$date) return 'N/A';
  try {
    return date('m.d.Y', strtotime($date));
  } catch (Exception $e) {
    return 'N/A';
  }
}

function formatDbDateTimeForDisplay($datetime)
{
  if (!$datetime) return 'Never';
  try {
    return date('g:iA/m.d.Y', strtotime($datetime));
  } catch (Exception $e) {
    return 'Never';
  }
}
// ===== END OF HELPER FUNCTIONS =====


// ===== 4. Fetch Housekeeping Room Status =====
$hkRoomsStatus = [];
$sql_hk_rooms = "SELECT
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
                pms_rooms r
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

if ($result_hk_rooms = $conn->query($sql_hk_rooms)) {
  while ($row = $result_hk_rooms->fetch_assoc()) {
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
    $hkRoomsStatus[] = [
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
  $result_hk_rooms->free();
} else {
  error_log("Admin Error fetching HK room statuses: " . $conn->error);
}

// ===== 5. Fetch Housekeeping History Data =====
$hkHistoryData = [];
$sql_hk_history = "SELECT 
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
                    pms_rooms r ON ht.RoomID = r.room_id
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

if ($result_hk_history = $conn->query($sql_hk_history)) {
  while ($row = $result_hk_history->fetch_assoc()) {
    $staffName = 'N/A';
    if ($row['Fname']) {
      $staffName = trim(
        htmlspecialchars($row['Fname']) .
          (empty($row['Mname']) ? '' : ' ' . strtoupper(substr(htmlspecialchars($row['Mname']), 0, 1)) . '.') .
          ' ' .
          htmlspecialchars($row['Lname'])
      );
    }
    $hkHistoryData[] = [
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
  $result_hk_history->free();
} else {
  error_log("Admin Error fetching HK history: " . $conn->error);
}


// ===== 6. Fetch Maintenance Room Status =====
$mtRoomsStatus = [];
$sql_mt_rooms = "SELECT
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
                pms_rooms r
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

if ($result_mt_rooms = $conn->query($sql_mt_rooms)) {
  while ($row = $result_mt_rooms->fetch_assoc()) {
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
    $mtRoomsStatus[] = [
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
  $result_mt_rooms->free();
} else {
  error_log("Admin Error fetching MT room statuses: " . $conn->error);
}

// 7. Fetch Maintenance History Data
$mtHistoryData = [];
$sql_mt_history = "SELECT 
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
                    pms_rooms r ON mr.RoomID = r.room_id
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

if ($result_mt_history = $conn->query($sql_mt_history)) {
  while ($row = $result_mt_history->fetch_assoc()) {
    $staffName = 'N/A';
    if ($row['Fname']) {
      $staffName = trim(
        htmlspecialchars($row['Fname']) .
          (empty($row['Mname']) ? '' : ' ' . strtoupper(substr(htmlspecialchars($row['Mname']), 0, 1)) . '.') .
          ' ' .
          htmlspecialchars($row['Lname'])
      );
    }
    $mtHistoryData[] = [
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
  $result_mt_history->free();
} else {
  error_log("Admin Error fetching MT history: " . $conn->error);
}


// 8. Close database connection
$conn->close();
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
          <h3 class="profileName"><?php echo $formattedName; // Use the name fetched from DB 
                                  ?></h3>
          <p class="profileRole"><?php echo ucfirst($Accounttype); // Use AccountType fetched from DB 
                                  ?></p>
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
          </div>
        </section>

        <section class="dashboardSection">
          <h2 class="sectionTitle">Users</h2>
          <div class="statsGrid" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));">
            <div class="statCard">
              <h3 class="statLabel">Total Employees</h3>
              <p class="statValue">0</p>
            </div>
            <div class="statCard">
              <h3 class="statLabel">Admin</h3>
              <p class="statValue">0</p>
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
            <div class="statCard">
              <h3 class="statLabel">Inventory</h3>
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
        </div>

        <div class="tabContent active" id="hk-requests-tab">
          <div class="controlsRow">
            <div class="filterControls">
              <select class="filterDropdown" id="hkfloorFilter">
                <option value="">Floor</option>
              </select>
              <select class="filterDropdown" id="hkroomFilter">
                <option value="">Room</option>
              </select>
              <div class="searchBox">
                <input type="text" placeholder="Search Room Number..." class="searchInput" id="hkSearchInput" />
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
                  <th>Date</th>
                  <th>Request Time</th>
                  <th>Last Clean</th>
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
            <div class="paginationControls" id="hk-requests-tab-pagination">
            </div>
          </div>
        </div>

        <div class="tabContent" id="hk-history-tab">
          <div class="controlsRow">
            <div class="filterControls">
              <select class="filterDropdown" id="floorFilterHkHist">
                <option value="">Floor</option>
              </select>
              <select class="filterDropdown" id="roomFilterHkHist">
                <option value="">Room</option>
              </select>
              <input type="date" class="filterDropdown" id="dateFilterHkHist" style="width: 150px; padding: 8px 14px;">
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
                  <th>Task</th>
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
            <div class="paginationControls" id="hk-history-tab-pagination">
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
        </div>

        <div class="tabContent active" id="mt-requests-tab">
          <div class="controlsRow">
            <div class="filterControls">
              <select class="filterDropdown" id="mtFloorFilter">
                <option value="">Floor</option>
              </select>
              <select class="filterDropdown" id="mtRoomFilter">
                <option value="">Room</option>
              </select>
              <div class="searchBox">
                <input type="text" placeholder="Search Room Number..." class="searchInput" id="mtSearchInput" />
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
                  <th>Date</th>
                  <th>Request Time</th>
                  <th>Last Maintenance</th>
                  <th>Status</th>
                  <th>Staff In Charge</th>
                </tr>
              </thead>
              <tbody id="mtRequestsTableBody">
              </tbody>
            </table>
          </div>

          <div class="pagination">
            <span class="paginationInfo">Display Records <span id="mtRequestsRecordCount">0</span></span>
            <div class="paginationControls" id="mt-requests-tab-pagination">
            </div>
          </div>
        </div>

        <div class="tabContent" id="mt-history-tab">
          <div class="controlsRow">
            <div class="filterControls">
              <select class="filterDropdown" id="mtFloorFilterHist">
                <option value="">Floor</option>
              </select>
              <select class="filterDropdown" id="mtRoomFilterHist">
                <option value="">Room</option>
              </select>
              <input type="date" class="filterDropdown" id="dateFilterMtHist" style="width: 150px; padding: 8px 14px;">
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
                  <th>Type</th>
                  <th>Date</th>
                  <th>Requested Time</th>
                  <th>Completed Time</th>
                  <th>Staff In Charge</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody id="mtHistTableBody">
              </tbody>
            </table>
          </div>

          <div class="pagination">
            <span class="paginationInfo">Display Records <span id="mtHistRecordCount">0</span></span>
            <div class="paginationControls" id="mt-history-tab-pagination">
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

        <div class="pagination" id="parking-page-pagination">
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
                  <th>Stock In Date</th>
                </tr>
              </thead>
              <tbody id="inventoryTableBody"></tbody>
            </table>
          </div>

          <div class="pagination" id="inv-items-tab-pagination">
            <span class="paginationInfo">Display Records <span id="inventoryRecordCount">0</span></span>
            <div class="paginationControls"></div>
          </div>
        </div>

        <div class="tabContent" id="inv-history-tab">
          <div class="controlsRow">
            <div class="filterControls">
              <select class="filterDropdown" id="invHistCategoryFilter">
                <option value="">Category</option>
              </select>
              <select class="filterDropdown" id="invHistActionFilter">
                <option value="">Action</option>
                <option value="Initial Stock In">Initial Stock In</option>
                <option value="Stock Added">Stock Added</option>
                <option value="Item Issued">Item Issued</option>
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
                  <th>Log ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Old Qty</th>
                  <th>Change</th>
                  <th>New Qty</th>
                  <th>Status</th>
                  <th>Stock In</th>
                  <th>Performed By</th>
                </tr>
              </thead>
              <tbody id="invHistTableBody"></tbody>
            </table>
          </div>

          <div class="pagination" id="inv-history-tab-pagination">
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
              <option value="Needs Maintenance">Needs Maintenance</option>
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
                <th>Status</th>

              </tr>
            </thead>
            <tbody id="roomsTableBody">
            </tbody>
          </table>
        </div>

        <div class="pagination" id="rooms-page-pagination">
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

          <div class="pagination" id="user-management-tab-pagination">
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
                  <th>Last Name</th>
                  <th>First Name</th>
                  <th>Middle Name</th>
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

          <div class="pagination" id="user-logs-tab-pagination">
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
            <option value="Available">Available</option>
            <option value="Needs Cleaning">Needs Cleaning</option>
            <option value="Needs Maintenance">Needs Maintenance</option>
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
      <h2 id="userModalTitle">Add User from Employee</h2>
      <div id="userFormMessage" class="formMessage" style="display:none;"></div>

      <form id="employeeCodeForm" style="display: block;">
        <div class="formGroup">
          <label for="employeeCodeInput">Employee Code *</label>
          <input type="text" id="employeeCodeInput" name="employeeCode" required
            placeholder="e.g., EMP-0001"
            style="font-size: 16px; padding: 12px;" />
          <small style="color: #666; font-size: 11px; display: block; margin-top: 5px;">
            Enter the Employee Code from the employees table. Only employees with these positions can be added:<br>
            <strong>Administrator, Housekeeping Manager, House Keeping Staff, Maintenance Manager, Maintenance Staff, Inventory Manager, Parking Manager</strong>
          </small>
        </div>

        <div class="modalButtons">
          <button type="button" class="modalBtn cancelBtn" id="cancelEmployeeCodeBtn">CANCEL</button>
          <button type="submit" class="modalBtn confirmBtn" id="lookupEmployeeBtn">ADD EMPLOYEE</button>
        </div>
      </form>

      <div id="userDetailsDisplay" style="display: none;">
        <input type="hidden" id="editUserId" name="userID">

        <div class="userProfileSection">
          <div class="profileAvatar">
            <img src="assets/icons/profile-icon.png" alt="Profile" />
          </div>
          <h3 id="displayFullName" class="editUserName">User Full Name</h3>
          <p class="editUserEmployeeId">Employee Code: <span id="displayEmployeeCode">------</span></p>
        </div>

        <div class="infoGrid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
          <div>
            <label style="font-size: 11px; color: #666; display: block; margin-bottom: 3px;">Email</label>
            <div id="displayEmail" style="font-size: 14px; font-weight: 500;">-</div>
          </div>
          <div>
            <label style="font-size: 11px; color: #666; display: block; margin-bottom: 3px;">Account Type</label>
            <div id="displayAccountType" style="font-size: 14px; font-weight: 500;">-</div>
          </div>
          <div>
            <label style="font-size: 11px; color: #666; display: block; margin-bottom: 3px;">Shift</label>
            <div id="displayShift" style="font-size: 14px; font-weight: 500;">-</div>
          </div>
          <div>
            <label style="font-size: 11px; color: #666; display: block; margin-bottom: 3px;">Username</label>
            <div id="displayUsername" style="font-size: 14px; font-weight: 500;">-</div>
          </div>
        </div>

        <form id="passwordChangeForm">
          <div class="formGroup">
            <label for="newPassword">New Password *</label>
            <input type="password" id="newPassword" name="password" required
              placeholder="Enter new password"
              style="border: 2px solid #4CAF50;" />
            <small style="color: #666; font-size: 11px; display: block; margin-top: 5px;">
              All other user information is read-only and comes from the employees table.
            </small>
          </div>

          <div class="modalButtons">
            <button type="button" class="modalBtn cancelBtn" id="cancelPasswordChangeBtn">CANCEL</button>
            <button type="submit" class="modalBtn confirmBtn" id="savePasswordBtn">UPDATE PASSWORD</button>
          </div>
        </form>
      </div>
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

  <script>
    // Pass PHP data to JavaScript
    const initialHkRequestsData = <?php echo json_encode($hkRoomsStatus ?? []); ?>;
    const initialHkHistoryData = <?php echo json_encode($hkHistoryData ?? []); ?>;
    const initialMtRequestsData = <?php echo json_encode($mtRoomsStatus ?? []); ?>;
    const initialMtHistoryData = <?php echo json_encode($mtHistoryData ?? []); ?>;
  </script>

  <script src="script/shared-data.js"></script>
  <script src="script/admin.config.js"></script>
  <script src="script/admin.utils.js"></script>
  <script src="script/admin.pagination.js"></script>
  <script src="script/admin.dashboard.js"></script>
  <script src="script/admin.ui.js"></script>
  <script src="script/admin.rooms.js"></script>
  <script src="script/admin.users.js"></script>
  <script src="script/admin.userLogs.js"></script>
  <script src="script/admin.housekeeping.js"></script>
  <script src="script/admin.maintenance.js"></script>
  <script src="script/admin.parking.js"></script>
  <script src="script/admin.inventory.js"></script>
  <script src="script/admin.js"></script>
</body>

</html>