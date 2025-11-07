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
  header("Location: signin.php");
  exit();
}
// If they ARE logged in, the rest of the page will load.
?>

<!DOCTYPE html>
<html lang="en">

<head>
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
  $Accounttype = htmlspecialchars($userData['Accounttype']); // Using Accounttype to match your error
  // Close the DB connection (optional, but good practice)
  $conn->close();

  ?>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Celestia Hotel - Parking Management</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&display.swap" rel="stylesheet">

    <link rel="stylesheet" href="css/parking.css">
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

    <div class="container">
        <div class="title-bar">
            <h2 class="title">PARKING</h2>
            <div class="controls">
                <select id="areaSelect">
                    <option value="all">Area</option>
                </select>
                <div class="search-box">
                    <input type="text" placeholder="Search" class="searchInput">
                    <button class="search-btn"><img src="assets/icons/search-icon.png" alt="Search" /></button>
                </div>
                <button class="download-icon" id="downloadIcon">
                    <img src="assets/icons/download-icon.png" alt="Download" />
            </button>
            </div>
        </div>

        <div class="tabs">
            <button class="tab active" data-tab="dashboard">Dashboard</button>
            <button class="tab" data-tab="slots">Slots</button>
            <button class="tab" data-tab="vehicleIn">Vehicle In</button>
            <button class="tab" data-tab="history">History</button>
        </div>

        <div class="content" id="dashboardContent">
            <div class="section-header">Current Parking Details</div>

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

            <table>
                <thead>
                    <tr>
                        <th>Area</th>
                        <th>Available</th>
                        <th>Occupied</th>
                        <th>Total</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
        </div>

        <div class="content hidden" id="slotsContent">
            <div class="table-header grid-5">
                <div>Area</div>
                <div>Slot Number</div>
                <div>Allowed Vehicle</div>
                <div>Status</div>
                <div>Park Vehicle</div>
            </div>
            <div id="slotsTable"></div>
            <div class="pagination" id="pagination-slots"></div>
        </div>

        <div class="content hidden" id="vehicleInContent">
            <div class="table-header grid-8">
                <div>Slot Number</div>
                <div>Plate #</div>
                <div>Room</div>
                <div>Name</div>
                <div>Vehicle Type</div>
                <div>Category</div>
                <div>Enter Time</div>
                <div>Enter Date</div>
                <div>Exit Vehicle</div>
            </div>
            <div id="vehicleInTable"></div>
            <div class="pagination" id="pagination-vehicleIn"></div>
        </div>

        <div class="content hidden" id="historyContent">
            <div class="table-header grid-9">
                <div>Slot Number</div>
                <div>Plate #</div>
                <div>Room</div>
                <div>Name</div>
                <div>Vehicle Type</div>
                <div>Category</div>
                <div>Parking Time</div>
                <div>Enter Time</div>
                <div>Enter Date</div>
            </div>
            <div id="historyTable"></div>
            <div class="pagination" id="pagination-history"></div>
        </div>
    </div>

    <div class="modal-overlay" id="enterVehicleModal">
        <div class="modal">
            <button class="modal-close" data-modal-id="enterVehicleModal">×</button>
            <div class="modal-header">
                <div class="modal-icon">
                    <img src="assets/icons/parkinglot_2.png" alt="Parking Icon" class="modal-img-icon">
                </div>
                <div>
                    <div class="modal-title" id="slotNumberTitle">1A01</div>
                    <div class="modal-text">You can update the details of guest information below. Make sure all information is accurate before saving the changes to keep the parking records up to date.</div>
                </div>
            </div>

            <div class="form-grid">
                <div class="form-field">
                    <label>Name</label>
                    <input type="text" id="guestName">
                </div>
                <div class="form-field">
                    <label>Plate #</label>
                    <input type="text" id="plateNumber">
                </div>
                <div class="form-field">
                    <label>Room</label>
                    <input type="text" id="roomNumber">
                </div>
                <div class="form-field">
                    <label>Vehicle
                        <img src="assets/icons/parking-edit.png" alt="Edit Vehicle Type" class="label-icon" id="btnEditVehicleType">
                    </label>
                    <select id="vehicleType">
                        <option value="">Select</option>
                        <option>2 Wheeled</option>
                        <option>4 Wheeled</option>
                    </select>
                </div>
            </div>

            <div class="form-grid">
                <div class="form-field">
                    <label>Category
                        <img src="assets/icons/parking-edit.png" alt="Edit Category" class="label-icon" id="btnEditCategoryIcon">
                    </label>
                    <select id="categorySelect">
                        <option>Sedan</option>
                        <option>SUV</option>
                        <option>Pickup</option>
                        <option>Van</option>
                        <option>Motorcycle</option>
                        <option>Truck</option>
                    </select>
                </div>
                <div class="form-field">
                    <label>Slot Number</label>
                    <select id="slotSelect" disabled>
                        <option>1A01</option>
                    </select>
                </div>
            </div>
            <div class="text-center" style="margin-top:30px">
                <button class="btn-yellow" id="btnSaveVehicle">SAVE</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay" id="editCategoryModal">
        <div class="modal">
            <button class="modal-close" data-modal-id="editCategoryModal">×</button>

            <div class="modal-header">
                <div class="modal-title" id="editCategoryTitle">Edit Category</div>
            </div>

            <div class="modal-body">
                <div class="form-field">
                    <label>Add New</label>
                    <input type="text" id="newCategoryName" placeholder="Enter new item name">
                </div>

                <div class="category-list-container">
                    <div class="category-list" id="editCategoryList">
                        <div class="category-list-item">
                            <span>Sedan</span>
                            <div class="category-item-actions">
                                <img src="edit.png" alt="Edit" class="list-icon">
                                <img src="bin.png" alt="Delete" class="list-icon">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-buttons">
                <button class="btn-yellow" id="btnAddCategoryItem">ADD CATEGORY</button>
                <button class="btn-yellow" data-modal-id="editCategoryModal">SAVE CHANGES</button>
            </div>
        </div>
    </div>
    <div class="modal-overlay" id="damageModal">
        <div class="modal modal-damage">
            <button class="modal-close" data-modal-id="damageModal">×</button>
            <div class="modal-title-center">⚠️ DAMAGE ITEMS</div>
            <table class="damage-summary-table">
                <thead>
                    <tr>
                        <th>ID, 101</th>
                        <th>Total</th>
                        <th>Damage</th>
                        <th>Non Damage</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td id="damageId">101</td>
                        <td id="damageTotal">5</td>
                        <td id="damageDamaged">2</td>
                        <td id="damageNonDamaged">3</td>
                    </tr>
                </tbody>
            </table>

            <div class="damage-form">
                <div class="form-row-damage">
                    <div class="form-field-damage">
                        <label>Types Of Damages</label>
                        <input type="text" id="damageType" placeholder="e.g., Burnt">
                    </div>
                    <div class="form-field-damage-small">
                        <label>No. Of Damages</label>
                        <input type="number" id="damageCount" min="1" value="1">
                    </div>
                    <button class="btn-add-damage" id="btnAddDamage">Add Damage Item</button>
                </div>
            </div>

            <div class="damages-section">
                <h3>Damages</h3>
                <table class="damages-list-table">
                    <thead>
                        <tr>
                            <th>Types of Damages</th>
                            <th>Date Damages</th>
                            <th>No. Of Damages</th>
                        </tr>
                    </thead>
                    <tbody id="damagesListBody">
                        <tr>
                            <td>Burnt</td>
                            <td>10/25/25</td>
                            <td>2</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="modal-overlay" id="confirmModal">
        <div class="modal modal-gradient">
            <h2 class="modal-title-yellow">Are you sure you want to enter this vehicle into the parking area?</h2>
            <p class="modal-text-gray">Please review the details before confirming. Once entered, the vehicle will be recorded and visible in the parking system.</p>
            <div class="modal-buttons">
                <button class="btn-yellow" data-modal-id="confirmModal">CANCEL</button>
                <button class="btn-yellow" id="btnConfirmEnter">YES, ENTER VEHICLE</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay" id="successModal">
        <div class="modal modal-gradient">
            <div class="modal-icon-large">P</div>
            <h2 class="modal-subtitle">Vehicle Entered Successfully</h2>
            <button class="btn-yellow" data-modal-id="successModal">OKAY</button>
        </div>
    </div>

    <div class="modal-overlay" id="exitModal">
        <div class="modal modal-gradient">
            <h2 class="modal-title-yellow">Exit?</h2>
            <div class="info-section">
                <div class="info-row">
                    <span>Slot Number:</span>
                    <span id="exitSlotNumber">1L - A6</span>
                </div>
                <div class="info-row">
                    <span>Plate #:</span>
                    <span id="exitPlate">AB123C</span>
                </div>
                <div class="info-row">
                    <span>Vehicle:</span>
                    <span id="exitVehicle">Sedan</span>
                </div>
                <div class="info-row">
                    <span>Enter Date and Time:</span>
                    <span id="exitDateTime">2025.10.25 / 6:30PM</span>
                </div>
            </div>
            <div class="modal-buttons">
                <button class="btn-yellow" data-modal-id="exitModal">CANCEL</button>
                <button class="btn-yellow" id="btnConfirmExit">EXIT</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay" id="saveConfirmModal">
        <div class="modal modal-gradient">
            <h2 class="modal-title-yellow">Are you sure you want to save information?</h2>
            <p class="modal-text-gray">Please double-check all entered details before proceeding. Once confirmed, your account will be updated.</p>
            <div class="modal-buttons">
                <button class="btn-yellow" data-modal-id="saveConfirmModal">CANCEL</button>
                <button class="btn-yellow" id="btnConfirmSave">YES, UPDATE</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay" id="saveSuccessModal">
        <div class="modal modal-gradient">
            <div class="modal-icon-user">
                👤
                <div class="checkmark">✓</div>
            </div>
            <h2 class="modal-subtitle">Save Changes Successfully</h2>
            <button class="btn-yellow" data-modal-id="saveSuccessModal">OKAY</button>
        </div>
    </div>

    <div class="modal-overlay" id="downloadModal">
        <div class="modal modal-gradient">
            <div class="download-icon-large">⬇️</div>
            <h2 class="modal-subtitle">Download File?</h2>
            <button class="btn-yellow" id="btnConfirmDownload">DOWNLOAD</button>
        </div>
    </div>

    <div id="toast-container"></div>

    <script src="script/parking.js"></script>
</body>

</html>