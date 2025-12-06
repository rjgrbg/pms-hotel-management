<?php
// Include the session check and login requirement logic
include('check_session.php');

// Only allow users with the 'admin' AccountType
require_login(['parking_manager']);

// --- Fetch User Data from Database ---
include('db_connection.php'); // Ensure DB connection is included
header('Cache-Control: no-cache, no-store, must-revalidate'); 
header('Pragma: no-cache');
header('Expires: 0');
$formattedName = 'ParkingManager'; // Default name
$Accounttype = 'parking_manager'; // Default type
$Fname = ''; // Initialize Fname
$Mname = ''; // Initialize Mname
$Lname = ''; // Initialize Lname

if (isset($_SESSION['UserID'])) {
    $userId = $_SESSION['UserID'];
    $sql = "SELECT Fname, Mname, Lname, AccountType FROM pms_users WHERE UserID = ?"; 
    
    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("i", $userId);
        if ($stmt->execute()) {
            $result = $stmt->get_result();
            if ($user = $result->fetch_assoc()) {
                // Fetch names and sanitize for display
                $Lname = htmlspecialchars($user['Lname'] ?? 'ParkingManager');
                $Fname = htmlspecialchars($user['Fname'] ?? '');
                $Mname = htmlspecialchars($user['Mname'] ?? '');
                $Accounttype = htmlspecialchars($user['AccountType'] ?? 'parking_manager'); // Fetch AccountType as well

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
                    $formattedName = 'ParkingManager'; // Fallback to default
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
    <title>The Celestia Hotel - Parking Management</title>
    
    <link rel="stylesheet" href="css/parking.css?v=1.9">
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    
    <style>
    /* Wrapper for select + edit button */
    .category-select-wrapper {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .category-select-wrapper select {
        flex-grow: 1;
        width: auto; /* Fix for flex */
    }

    /* Edit button */
    .edit-category-btn {
        padding: 8px 12px;
        font-size: 13px;
        font-weight: 600;
        background-color: #ffc107;
        color: #212529;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.2s ease;
        flex-shrink: 0;
        width: auto; /* Fix for flex */
    }
    .edit-category-btn:hover {
        background-color: #e0a800;
    }
    .edit-category-btn .fa-pencil-alt {
        margin-right: 5px;
    }

    /* Input + Add button wrapper */
    .add-category-wrapper {
        display: flex;
        gap: 10px;
    }
    .add-category-wrapper input {
        flex-grow: 1;
        width: auto; /* Fix orientation */
    }
    .add-category-wrapper .submit-btn {
        flex-shrink: 0;
        padding: 10px 15px;
        line-height: 1.5;
        width: auto; /* Fix orientation */
    }
    
    .category-divider {
        border: none;
        border-top: 1px solid #eee;
        margin: 20px 0;
    }

    /* List container */
    .category-list-container {
        max-height: 250px;
        overflow-y: auto;
        border: 1px solid #ddd;
        border-radius: 5px;
        padding: 10px;
        background: #fdfdfd;
    }
    .category-list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid #eee;
    }
    .category-list-item:last-child { border-bottom: none; }
    .category-list-item .category-name {
        font-size: 15px;
        color: #333;
        font-weight: 500;
        word-break: break-all; /* Handle long names */
    }
    .category-actions .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        color: #555;
        margin-left: 10px;
        transition: color 0.2s ease;
    }
    .category-actions .btn-edit-category:hover, 
    .category-actions .btn-edit-area:hover,
    .category-actions .btn-edit-slot:hover { color: #007bff; }
    
    .category-actions .btn-delete-category:hover,
    .category-actions .btn-archive-area:hover,
    .category-actions .btn-archive-slot:hover { color: #dc3545; }

    /* NEW: Restore Button Styles */
    .category-actions .btn-restore-area:hover,
    .category-actions .btn-restore-slot:hover { color: #28a745; }

    /* NEW: Archived Row Style */
    tr.archived-slot { background-color: #f9f9f9; color: #999; }
    tr.archived-slot td { color: #999; }
    tr.archived-slot .status-badge { background-color: #e0e0e0; color: #777; border: 1px solid #ccc; }

    /* Modal footer */
    .modal-footer {
        text-align: right; 
        padding: 15px 30px;
        border-top: 1px solid #eee;
        margin-top: 15px;
    }

    /* Vertical form group */
    .form-group-vertical {
        display: block;
    }
    .form-group-vertical label {
        display: block;
        margin-bottom: 8px;
    }

    /* Spinner */
    .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        animation: spin 1s linear infinite;
        margin: 20px auto;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
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
    </header> 

    <aside class="profile-sidebar" id="profile-sidebar">
        <button class="sidebar-close-btn" id="sidebar-close-btn">&times;</button>
        
        <div class="profile-header">
            <div class="profile-pic-container">
                <i class="fas fa-user-tie"></i>
            </div>
            <h3><?php echo $formattedName; ?></h3>
        <p><?php echo $Accounttype; ?></p>
        </div>

        <nav class="profile-nav">
            
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
        <h1 class="pageTitle">PARKING</h1>
        <p class="pageDescription">Manage parking slots, track vehicle entries and exits, and view parking history</p>

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
                    <button class="add-btn" id="btnManageAreas" style="margin-left: 10px; background-color: #480c1b; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-map-marker-alt"></i> Manage Areas
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
                        <option value="archived" style="color:red; font-weight:bold;">Archived</option>
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
                    <button class="add-btn" id="btnAddSlot" style="margin-left: 10px; background-color: #480c1b; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-plus"></i> Add Slot
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
                    <button class="downloadBtn" id="downloadBtnActive">
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
                            <th class="sortable" data-sort="EntryTime">Enter Time</th>
                            <th class="sortable" data-sort="EntryDate">Enter Date</th>
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
                        <input type="text" id="guestName" required class="sanitize-on-paste">
                    </div>
                    <div class="form-group">
                        <label for="plateNumber">Plate #</label>
                        <input type="text" id="plateNumber" required class="sanitize-on-paste">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="roomNumber">Rooms</label>
                        <select id="roomNumber" required>
                                    <option value="">Loading...</option>
                                </select>
                    </div>
                        <div class="form-group">
                            <label for="vehicleType">Vehicle Type</label>
                            <div class="category-select-wrapper">
                                <select id="vehicleType" required>
                                    <option value="">Loading...</option>
                                </select>
                                <button type="button" class="edit-category-btn" id="open-types-modal-btn">
                                    <i class="fas fa-pencil-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="categorySelect">Category</label>
                        <div class="category-select-wrapper">
                            <select id="categorySelect" required>
                                 <option value="">Select vehicle type first...</option>
                            </select>
                            <button type="button" class="edit-category-btn" id="open-categories-modal-btn">
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                        </div>
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

    
    <div class="modal-overlay" id="manage-types-modal">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title">
                    <i class="fas fa-car-side modal-icon-fa"></i>
                    <h2>Manage Vehicle Types</h2>
                </div>
                <button class="modal-close-btn" data-modal-id="manage-types-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="new-type-name">Add New Type</label>
                    <div class="add-category-wrapper">
                        <input type="text" id="new-type-name" placeholder="Enter new type name" class="sanitize-on-paste">
                        <button type="button" class="submit-btn" id="add-new-type-btn">ADD</button>
                    </div>
                </div>
                <hr class="category-divider">
                <div class="form-group form-group-vertical">
                    <label>Existing Types</label>
                    <div class="category-list-container" id="types-list-container">
                        <div class="spinner"></div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                 <button type="button" class="submit-btn btn-cancel-white" data-modal-id="manage-types-modal">DONE</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay" id="manage-categories-modal">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title">
                    <i class="fas fa-tags modal-icon-fa"></i>
                    <h2>Manage Categories</h2>
                </div>
                <button class="modal-close-btn" data-modal-id="manage-categories-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="category-manager-type-select">First, select a Vehicle Type:</label>
                    <select id="category-manager-type-select">
                        <option value="">Loading...</option>
                    </select>
                </div>
                <hr class="category-divider">
                <div class="form-group">
                    <label for="new-category-name">Add New Category (for selected type)</label>
                    <div class="add-category-wrapper">
                        <input type="text" id="new-category-name" placeholder="Enter new category name" class="sanitize-on-paste">
                        <button type="button" class="submit-btn" id="add-new-category-btn">ADD</button>
                    </div>
                </div>
                <div class="form-group form-group-vertical" style="margin-top: 15px;">
                    <label>Existing Categories (for selected type)</label>
                    <div class="category-list-container" id="categories-list-container">
                        <p style="text-align:center; color: #777;">Please select a vehicle type above.</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                 <button type="button" class="submit-btn btn-cancel-white" data-modal-id="manage-categories-modal">DONE</button>
            </div>
        </div>
    </div>
    
    <div class="modal-overlay" id="edit-name-modal">
        <div class="modal-content" style="max-width: 400px;">
             <div class="modal-header">
                <div class="modal-title">
                    <i class="fas fa-pencil-alt modal-icon-fa"></i>
                    <h2 id="edit-name-title">Edit Name</h2>
                </div>
                <button class="modal-close-btn" data-modal-id="edit-name-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="edit-name-form">
                    <input type="hidden" id="edit-id-input">
                    <input type="hidden" id="edit-type-input"> <div class="form-group">
                        <label for="edit-name-input">Name</label>
                        <input type="text" id="edit-name-input" required class="sanitize-on-paste">
                    </div>
                    <div class="edit-modal-buttons">
                         <button type="button" class="submit-btn btn-cancel-white" data-modal-id="edit-name-modal">CANCEL</button>
                         <button type="submit" class="submit-btn">SAVE</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="modal-overlay" id="manageAreasModal">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title"><i class="fas fa-map-marker-alt modal-icon-fa"></i> <h2>Manage Areas</h2></div>
                <button class="modal-close-btn" data-modal-id="manageAreasModal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Add New Area</label>
                    <div class="add-category-wrapper">
                        <input type="text" id="newAreaName" placeholder="Area Name (e.g., Basement 1)">
                        <button type="button" class="submit-btn" id="btnSaveNewArea">ADD</button>
                    </div>
                </div>
                <hr class="category-divider">
                <div class="form-group form-group-vertical">
                    <label>Existing Areas</label>
                    <div class="category-list-container" id="areaListContainer">Loading...</div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal-overlay" id="manageSlotModal">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title"><i class="fas fa-parking modal-icon-fa"></i> <h2 id="slotModalTitle">Add Slot</h2></div>
                <button class="modal-close-btn" data-modal-id="manageSlotModal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="slotForm">
                    <input type="hidden" id="slotIdInput">
                    <div class="form-group">
                        <label>Area</label>
                        <select id="slotAreaSelect" required></select>
                    </div>
                    <div class="form-group">
                        <label>Slot Name/Number</label>
                        <input type="text" id="slotNameInput" required placeholder="e.g., A-01">
                    </div>
                    <div class="form-group">
                        <label>Allowed Vehicle Type</label>
                        <select id="slotTypeSelect" required></select>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" class="submit-btn">SAVE</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="modal-overlay" id="editAreaModal">
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <div class="modal-title"><h2>Edit Area</h2></div>
                <button class="modal-close-btn" data-modal-id="editAreaModal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="editAreaForm">
                    <input type="hidden" id="editAreaId">
                    <div class="form-group">
                        <label>Area Name</label>
                        <input type="text" id="editAreaName" required>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" class="submit-btn">UPDATE</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div id="toast-container"></div>

    <script>
        // This is a fallback in case the PHP fetch fails.
        // The actual $userData is injected by PHP at the top of the file.
        if (typeof window.INJECTED_USER_DATA === 'undefined') {
             window.INJECTED_USER_DATA = <?php echo json_encode(['Fname' => $Fname, 'Lname' => $Lname, 'Mname' => $Mname, 'AccountType' => $Accounttype]); ?>;
        }
    </script>
    
    <script src="script/download-utils.js?v=2.1"></script>
    <script src="script/parking.js?v=2.1"></script> 
</body>
</html>