<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Celestia Hotel - Parking Management</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="css/parking.css">
</head>
<body>
    <div class="header">
        <div class="header-left">
            <div class="logo">
                <img src="assets/images/celestia-logo.png" alt="The Celestia Hotel Logo">
            </div>
            <h1 class="hotel-name">THE CELESTIA HOTEL</h1>
        </div>
        <div class="user-icon"> 👤
            <div class="user-menu" id="userMenu">
                <div class="user-menu-header">
                    <div class="user-avatar">👤</div>
                    <div class="user-info">
                        <h3>Juan Bagayan</h3>
                        <div class="user-role">Parking Management Head</div>
                    </div>
                </div>
                <button id="btnAccountDetails">⚙️ Account Details</button> <button id="btnLogout">🚪 Logout</button> </div>
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
                    <input type="text" placeholder="Search">
                    <button class="search-btn">🔍</button>
                </div>
                <button class="download-icon" id="downloadIcon">⬇️</button> </div>
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
                    <div class="card-value">0</div> </div>
                <div class="card">
                    <div class="card-label">Available</div>
                    <div class="card-value">0</div> </div>
                <div class="card">
                    <div class="card-label">Total</div>
                    <div class="card-value">0</div> </div>
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
            <div class="pagination" id="pagination-slots"></div> </div>

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
            <div class="pagination" id="pagination-vehicleIn"></div> </div>

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
            <div class="pagination" id="pagination-history"></div> </div>
    </div>

    <div class="modal-overlay" id="enterVehicleModal">
        <div class="modal">
            <button class="modal-close" data-modal-id="enterVehicleModal">×</button>
            <div class="modal-header">
                <div class="modal-icon">🚗</div>
                <div>
                    <div class="modal-title" id="slotNumberTitle">1A56</div>
                    <div class="modal-text">You can update the details of guest information below. Make sure all information is accurate before saving the changes to keep the parking records up to date.</div>
                </div>
            </div>
            
            <div class="form-grid" style="grid-template-columns: 1fr 1fr 1fr; padding-bottom: 0;">
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
            </div>
            
            <div class="form-grid" style="grid-template-columns: 1fr 1fr; padding-top: 1rem;">
                <div class="form-field">
                    <label>Vehicle 🚗</label>
                    <select id="vehicleType">
                        <option value="">Select</option>
                        <option>2 Wheeled</option>
                        <option>4 Wheeled</option>
                    </select>
                </div>
                <div class="form-field">
                    <label>Category 🚗</label>
                    <div class="flex-field">
                        <select id="categorySelect">
                            <option>Sedan</option>
                            <option>SUV</option>
                            <option>Pickup</option>
                            <option>Van</option>
                            <option>Motorcycle</option>
                            <option>Truck</option>
                        </select>
                        <button class="edit-btn" id="btnEditCategory">✏️</button>
                    </div>
                </div>
                <div class="form-field full-width">
                    <label>Slot Number</label>
                    <select id="slotSelect" disabled>
                        <option>1A56</option>
                    </select>
                </div>
            </div>
            <div class="text-center">
                <button class="btn-yellow" id="btnSaveVehicle">SAVE</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay" id="editCategoryModal">
        <div class="modal">
            <button class="modal-close" data-modal-id="editCategoryModal">×</button>
            <div class="modal-title" style="text-align: center; margin-bottom: 1.5rem;">Edit Category</div>
            
            <div class="form-field" style="margin-bottom: 1.5rem;">
                <label>Vehicle</label>
                <input type="text" placeholder="Enter category name">
            </div>
            <div class="category-list">
              <div class="category-item">
                    <span>2 Wheeled</span>
                    <div class="category-wheels">
                        <span class="wheel-icon">🚲</span>
                        <span class="wheel-icon">🚗</span>
                    </div>
                </div>
                <div class="category-item">
                    <span>4 Wheeled</span>
                    <div class="category-wheels">
                        <span class="wheel-icon">🚲</span>
                        <span class="wheel-icon">🚗</span>
                    </div>
                </div>
            </div>
            <div class="modal-buttons">
                <button class="btn-yellow">ADD CATEGORY</button>
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
tr>
                            <td>Burnt</td>
                            <td>10/25/25</td>
                            <td>2</td>
                    </a> </tr>
                    </tbody>
                </table>
Â          </div>
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

    <div class="modal-overlay" id="logoutModal">
        <div class="modal modal-gradient">
            <div class="modal-icon-large">🚪</div>
            <h2 class="modal-subtitle">Are you sure you want to log out on your account?</h2>
            <div class="modal-buttons">
                <button class="btn-yellow" data-modal-id="logoutModal">CANCEL</button>
                <button class="btn-yellow" id="btnConfirmLogout">YES, LOGOUT</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay" id="accountModal">
        <div class="modal modal-large">
            <button class="modal-close" data-modal-id="accountModal">×</button>
            <div class="account-header">
                <div class="user-avatar">👤</div>
                <div class="account-info">
                    <h2>Juan Bagayan</h2>
                    <p>ID: 019284738475</p>
                    <p>Parking Management Head</p>
                </div>
            </div>
            <div class="form-grid">
                <div class="form-field">
                    <label>First Name</label>
                    <input type="text" id="firstName" value="Juan">
                </div>
                <div class="form-field">
                    <label>Email Address</label>
                    <input type="email" id="emailAddress" value="Juan@housekeeper.com">
                </div>
                <div class="form-field">
                    <label>Middle Name (Optional)</label>
                    <input type="text" id="middleName" value="Constant">
                </div>
                <div class="form-field">
                    <label>Username</label>
                    <input type="text" id="username" value="Juana">
                </div>
                <div class="form-field">
                    <label>Last Name</label>
                    <input type="text" id="lastName" value="Bagayan">
                </div>
                <div class="form-field">
                    <label>Password <span class="change-password">Change Password?</span></label>
                    <input type="password" id="password" value="************">
                </div>
                <div class="form-field">
                    <label>Birthday</label>
                    <input type="date" id="birthday" value="2004-10-25">
                </div>
                <div class="form-field">
                    <label>Contact</label>
                    <input type="text" id="contact" value="09222222222">
                </div>
                <div class="form-field">
                    <label>Shift</label>
                    <select id="shift">
                        <option selected>Day</option>
                        <option>Night</option>
                    </select>
                </div>
                <div class="form-field full-width">
                    <label>Address</label>
                    <input type="text" id="address" value="Block 1 Lot 2, Quezon City">
                </div>
            </div>
            <div class="text-center">
                <button class="btn-yellow" id="btnSaveChanges">SAVE CHANGES</button>
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