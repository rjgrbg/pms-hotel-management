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
  // Redirect them to the login page (adjust to your login page name)
  header("Location: signin.php"); 
  exit();
}

// 4. Load database and user data
require_once('db_connection.php');
require_once('User.php');

// Get database connection
$conn = get_db_connection('pms');
if (!$conn) {
    // Handle database connection error gracefully
    die("Database connection failed. Please try again later.");
}

// Pass the connection to the function
$userData = getUserData($conn); 
if (!$userData) {
    // User data not found, maybe session is valid but user deleted?
    // Log out and redirect to login
    session_destroy();
    header("Location: signin.php?error=userNotFound");
    exit();
}

// *** MODIFIED: Using the correct keys 'Name' and 'Accounttype' from inventory.php ***
$Fname = htmlspecialchars($userData['Name'] ?? 'Guest');
$Accounttype = htmlspecialchars($userData['Accounttype'] ?? 'Unknown');
$conn->close();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Celestia Hotel - Parking Management</title>
    
    <link rel="stylesheet" href="css/parking.css?v=1.5">
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js"></script>
</head>
<body>
    <header class="header">
        <div class="headerLeft">
            <img src="assets/images/celestia-logo.png" alt="Logo" class="headerLogo" />
            <span class="hotelName">THE CELESTIA HOTEL</span>
        </div>
        <img src="assets/icons/profile-icon.png" alt="Profile" class="profileIcon" id="profileBtn" />
    </header> 

    <aside class="profile-sidebar" id="profile-sidebar">
        <button class="sidebar-close-btn" id="sidebar-close-btn">&times;</button>
        
        <div class="profile-header">
            <div class="profile-pic-container">
                <i class="fas fa-user-tie"></i>
            </div>
            <h3><?php echo $Fname; ?></h3>
            <p><?php echo $Accounttype; ?></p>
        </div>

        <nav class="profile-nav">
            <a href="#" id="account-details-link">
                <i class="fas fa-user-edit" style="margin-right: 10px;"></i> Account Details
            </a>
        </nav>
        
        <div class="profile-footer">
            <a id="logoutBtn">
                <i class="fas fa-sign-out-alt" style="margin-right: 10px;"></i> Logout
            </a>
        </div>
    </aside>

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
        <h1 class="pageTitle">Parking</h1>

        <div class="tabNavigation">
            <button class="tabBtn active" data-tab="dashboard">
                <i class="fas fa-tachometer-alt tabIcon" style="font-size: 16px;"></i> Dashboard
            </button>
            <button class="tabBtn" data-tab="slots">
                <i class="fas fa-parking tabIcon" style="font-size: 16px;"></i> Slots
            </button>
            <button class="tabBtn" data-tab="vehicleIn">
                <i class="fas fa-car-side tabIcon" style="font-size: 16px;"></i> Vehicle In
            </button>
            <button class="tabBtn" data-tab="history">
                <i class="fas fa-history tabIcon" style="font-size: 16px;"></i> History
            </button>
        </div>

        <div class="tabContent active" id="dashboard-tab">
            <div class="controlsRow">
                <div class="filterControls">
                    <select class="filterDropdown" id="areaFilterDashboard">
                        <option value="all">All Areas</option>
                    </select>
                    <button class="refreshBtn" id="refreshBtnDashboard">
                        <img src="assets/icons/refresh-icon.png" alt="Refresh" />
                    </button>
                </div>
            </div>
            
            <div class="summary-cards">
                <div class="card">
                    <div class="card-label">Occupied</div>
                    <div class="card-value">0</div> 
                </div>
                <div class="card">
                    <div class="card-label">Available</div>
                    <div class="card-value">0</div> 
                </div>
                <div class="card">
                    <div class="card-label">Total</div>
                    <div class="card-value">0</div> 
                </div>
            </div>

            <div class="tableWrapper">
                <table class="requestsTable">
                    <thead>
                        <tr>
                            <th class="sortable" data-sort="AreaName">Area</th>
                            <th class="sortable" data-sort="available">Available</th>
                            <th class="sortable" data-sort="occupied">Occupied</th>
                            <th class="sortable" data-sort="total">Total</th>
                            <th class="sortable" data-sort="status">Status</th>
                        </tr>
                    </thead>
                    <tbody id="dashboardTableBody">
                        <tr><td colspan="5" style="text-align: center;">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="tabContent" id="slots-tab">
            <div class="controlsRow">
                <div class="filterControls">
                    <select class="filterDropdown" id="areaFilterSlots">
                        <option value="all">All Areas</option>
                    </select>
                    <select class="filterDropdown" id="statusFilterSlots">
                        <option value="all">All Status</option>
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                    </select>
                    <div class="searchBox">
                        <input type="text" placeholder="Search by Slot..." class="searchInput" id="searchSlots" />
                        <button class="searchBtn">
                            <img src="assets/icons/search-icon.png" alt="Search" />
                        </button>
                    </div>
                    <button class="refreshBtn" id="refreshBtnSlots">
                        <img src="assets/icons/refresh-icon.png" alt="Refresh" />
                    </button>
                </div>
            </div>
            <div class="tableWrapper">
                <table class="requestsTable">
                    <thead>
                        <tr>
                            <th class="sortable" data-sort="AreaName">Area</th>
                            <th class="sortable" data-sort="SlotName">Slot Number</th>
                            <th class="sortable" data-sort="AllowedVehicle">Allowed Vehicle</th>
                            <th class="sortable" data-sort="Status">Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="slotsTableBody">
                        <tr><td colspan="5" style="text-align: center;">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination" id="pagination-slots"></div>
        </div>

        <div class="tabContent" id="vehicleIn-tab">
            <div class="controlsRow">
                 <div class="filterControls">
                    <select class="filterDropdown" id="areaFilterVehicleIn">
                        <option value="all">All Areas</option>
                    </select>
                    <div class="searchBox">
                        <input type="text" placeholder="Search Plate, Name, Room..." class="searchInput" id="searchVehicleIn" />
                        <button class="searchBtn">
                            <img src="assets/icons/search-icon.png" alt="Search" />
                        </button>
                    </div>
                    <button class="refreshBtn" id="refreshBtnVehicleIn">
                        <img src="assets/icons/refresh-icon.png" alt="Refresh" />
                    </button>
                </div>
            </div>
            <div class="tableWrapper">
                <table class="requestsTable">
                    <thead>
                        <tr>
                            <th class="sortable" data-sort="SlotName">Slot Number</th>
                            <th class="sortable" data-sort="PlateNumber">Plate #</th>
                            <th class="sortable" data-sort="RoomNumber">Room</th>
                            <th class="sortable" data-sort="GuestName">Name</th>
                            <th class="sortable" data-sort="VehicleType">Vehicle Type</th>
                            <th class="sortable" data-sort="VehicleCategory">Category</th>
                            <th class="sortable" data-sort="EntryTime">Enter Time</th>
                            <th class="sortable" data-sort="EntryTime">Enter Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="vehicleInTableBody">
                        <tr><td colspan="9" style="text-align: center;">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination" id="pagination-vehicleIn"></div>
        </div>

        <div class="tabContent" id="history-tab">
            <div class="controlsRow">
                <div class="filterControls">
                    <select class="filterDropdown" id="areaFilterHistory">
                        <option value="all">All Areas</option>
                    </select>
                    <div class="searchBox">
                        <input type="text" placeholder="Search Plate, Name, Room..." class="searchInput" id="searchHistory" />
                        <button class="searchBtn">
                            <img src="assets/icons/search-icon.png" alt="Search" />
                        </button>
                    </div>
                    <button class="refreshBtn" id="refreshBtnHistory">
                        <img src="assets/icons/refresh-icon.png" alt="Refresh" />
                    </button>
                    <button class="downloadBtn" id="downloadBtnHistory">
                        <img src="assets/icons/download-icon.png" alt="Download" />
                    </button>
                </div>
            </div>
            <div class="tableWrapper">
                <table class="requestsTable">
                    <thead>
                        <tr>
                            <th class="sortable" data-sort="SlotName">Slot Number</th>
                            <th class="sortable" data-sort="PlateNumber">Plate #</th>
                            <th class="sortable" data-sort="RoomNumber">Room</th>
                            <th class="sortable" data-sort="GuestName">Name</th>
                            <th class="sortable" data-sort="VehicleType">Vehicle Type</th>
                            <th class="sortable" data-sort="VehicleCategory">Category</th>
                            <th>Parking Time</th>
                            <th class="sortable" data-sort="EntryTime">Enter Time/Date</th>
                            <th class="sortable" data-sort="ExitTime">Exit Time/Date</th>
                        </tr>
                    </thead>
                    <tbody id="historyTableBody">
                        <tr><td colspan="9" style="text-align: center;">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination" id="pagination-history"></div>
        </div>

    </div>

    <div class="modal-overlay" id="enterVehicleModal">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title">
                    <i class="fas fa-car-side modal-icon-fa"></i>
                    <h2 id="slotNumberTitle"></h2>
                </div>
                <button class="modal-close-btn" data-modal-id="enterVehicleModal">&times;</button>
            </div>
            <p class="modal-description">
                Enter the details of the guest information below. Make sure all information is accurate.
            </p>
            <div class="modal-body">
                <form id="enter-vehicle-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="guestName">Name</label>
                            <input type="text" id="guestName" required>
                        </div>
                        <div class="form-group">
                            <label for="plateNumber">Plate #</label>
                            <input type="text" id="plateNumber" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="roomNumber">Room</label>
                            <input type="text" id="roomNumber">
                        </div>
                        <div class="form-group">
                            <label for="vehicleType">Vehicle Type</label>
                            <select id="vehicleType" required>
                                <option value="">Loading...</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="categorySelect">Category</label>
                        <select id="categorySelect" required>
                             <option value="">Select vehicle type first...</option>
                        </select>
                    </div>
                    <button type="submit" class="submit-btn" id="btnSaveVehicle">SAVE</button>
                </form>
            </div>
        </div>
    </div>

    <div class="modal-overlay-confirm" id="confirmModal">
        <div class="modal-content-confirm">
            <h3>Are you sure you want to enter this vehicle?</h3>
            <p>Please review the details before confirming.</p>
            <div class="confirm-buttons">
                <button type="button" class="btn btn-cancel" data-modal-id="confirmModal">CANCEL</button>
                <button type="button" class="btn btn-confirm" id="btnConfirmEnter">YES, ENTER</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay-success" id="successModal">
        <div class="modal-content-success">
            <i class="fas fa-check-circle modal-icon" style="font-size: 60px; color: #FFA237; margin-bottom: 20px;"></i>
            <h3>Vehicle Entered Successfully</h3>
            <button type="button" class="btn btn-okay" data-modal-id="successModal">OKAY</button>
        </div>
    </div>

    <div class="modal-overlay-confirm" id="exitModal">
        <div class="modal-content-confirm" style="text-align: left;">
            <h3 style="text-align: center;">Exit Vehicle?</h3>
            <p>
                <strong>Slot:</strong> <span id="exitSlotNumber"></span><br>
                <strong>Plate #:</strong> <span id="exitPlate"></span><br>
                <strong>Vehicle:</strong> <span id="exitVehicle"></span><br>
                <strong>Entered:</strong> <span id="exitDateTime"></span>
            </p>
            <div class="confirm-buttons">
                <button type="button" class="btn btn-cancel" data-modal-id="exitModal">CANCEL</button>
                <button type="button" class="btn btn-confirm" id="btnConfirmExit" style="background-color: #c9302c; color: white;">YES, EXIT</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay" id="accountModal">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title">
                    <i class="fas fa-user-edit modal-icon-fa"></i>
                    <h2>Account Details</h2>
                </div>
                <button class="modal-close-btn" data-modal-id="accountModal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="account-details-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="firstName">First Name</label>
                            <input type="text" id="firstName" name="Fname">
                        </div>
                        <div class="form-group">
                            <label for="lastName">Last Name</label>
                            <input type="text" id="lastName" name="Lname">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="middleName">Middle Name (Optional)</label>
                            <input type="text" id="middleName" name="Mname">
                        </div>
                        <div class="form-group">
                            <label for="emailAddress">Email Address</label>
                            <input type="email" id="emailAddress" name="EmailAddress">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="username">Username</label>
                            <input type="text" id="username" name="Username">
                        </div>
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" name="Password" placeholder="Enter new password to change">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="birthday">Birthday</label>
                            <input type="date" id="birthday" name="Birthday">
                        </div>
                        <div class="form-group">
                            <label for="contact">Contact</label>
                            <input type="text" id="contact" name="ContactNumber">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="address">Address</label>
                        <input type="text" id="address" name="Address">
                    </div>
                    <button type="submit" class="submit-btn" id="btnSaveChanges">SAVE CHANGES</button>
                </form>
            </div>
        </div>
    </div>

    <div class="modal-overlay-confirm" id="saveConfirmModal">
        <div class="modal-content-confirm">
            <h3>Are you sure you want to save?</h3>
            <p>Please double-check all details. Your account will be updated.</p>
            <div class="confirm-buttons">
                <button type="button" class="btn btn-cancel" data-modal-id="saveConfirmModal">CANCEL</button>
                <button type="button" class="btn btn-confirm" id="btnConfirmSave">YES, UPDATE</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay-success" id="saveSuccessModal">
        <div class="modal-content-success">
            <i class="fas fa-user-check modal-icon" style="font-size: 60px; color: #FFA237; margin-bottom: 20px;"></i>
            <h3>Changes Saved Successfully</h3>
            <button type="button" class="btn btn-okay" data-modal-id="saveSuccessModal">OKAY</button>
        </div>
    </div>


    <div id="toast-container"></div>

    <script>
        window.INJECTED_USER_DATA = <?php echo json_encode($userData); ?>;
    </script>
    
    <script src="script/parking.js?v=1.5"></script>
</body>
</html>