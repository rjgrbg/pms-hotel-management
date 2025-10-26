<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Celestia Hotel - Inventory</title>
    <!-- Google Fonts --><link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Forum&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <!-- Font Awesome for icons --><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <!-- Main Stylesheet --><link rel="stylesheet" href="css/inventory_log_page.css">
</head>
<body>

    <!-- Header --><header class="header">
        <div class="header-left">
            <img src="assets/images/celestia-logo.png" alt="Logo" class="header-logo" />
            <span class="hotel-name">THE CELESTIA HOTEL</span>
        </div>
        <div class="header-right">
            <i class="fas fa-sign-out-alt logout-icon"></i>
        </div>
    </header>

    <!-- Main Container --><div class="main-container">
        <h1 class="page-title">INVENTORY</h1>

        <!-- Controls Row --><div class="controls-row">
            <div class="filter-controls">
                <select class="filter-dropdown" id="categoryFilter">
                    <option value="">All Categories</option>
                    <!-- Categories will be populated by JS --></select>
            </div>
            <div class="search-box">
                <input type="text" placeholder="Search by name or description..." class="search-input" id="searchInput" />
                <button class="search-btn">
                    <i class="fas fa-search"></i>
                </button>
            </div>
        </div>

        <!-- Inventory Table -->
         <div class="table-wrapper">
            <table class="inventory-table">
                <thead>
                    <tr>
                        <th>NAME</th>
                        <th>CATEGORY</th>
                        <th>QUANTITY</th>
                        <th>DESCRIPTION</th>
                        <th>ITEMS TO ISSUE</th>
                    </tr>
                </thead>
                <tbody id="inventoryTableBody">
                    <!-- Rows will be injected by JavaScript -->
                    </tbody>
            </table>
        </div>

        <!-- Item Details Section --><div class="item-details-section">
            <h2 class="section-title">ITEM DETAILS</h2>
            <!-- This content area will be populated by JS with a list of items --><div class="item-details-content" id="itemDetailsContent">
                <!-- JavaScript will inject the list of items to be issued here --></div>
            <div class="item-details-actions">
                <button class="action-btn cancel-btn" id="cancelBtn">CANCEL</button>
                <button class="action-btn done-btn" id="doneBtn">DONE</button>
            </div>
        </div>
    </div>

    <!-- ===== Custom Message Box (Modal) ===== -->
     <div class="message-box-backdrop" id="messageBoxBackdrop">
        <div class="message-box-content">
            <h3 id="messageBoxTitle">Notice</h3>
            <!-- Use <pre> tag to preserve line breaks in the message --><pre id="messageBoxText">This is a sample message.</pre>
            <button class="action-btn" id="messageBoxClose">OK</button>
        </div>
    </div>
    <!-- ===== End of Message Box ===== --><!-- ===== Confirmation Modal ===== --><div class="confirmation-modal-backdrop" id="confirmationModalBackdrop">
        <div class="confirmation-modal-content">
            <div class="confirmation-modal-header">
                ITEM DETAILS
            </div>
            <div class="confirmation-modal-body" id="confirmationModalBody">
                <!-- Confirmation list will be injected here --></div>
            <div class="confirmation-modal-actions">
                <button class="action-btn-outline" id="cancelConfirmBtn">CANCEL</button>
                <button class="action-btn-confirm" id="confirmBtn">CONFIRM</button>
            </div>
        </div>
    </div>
    <!-- ===== End of Confirmation Modal ===== --><!-- ===== Logout Confirmation Modal ===== --><div class="logout-modal-backdrop" id="logoutModalBackdrop">
        <div class="logout-modal-content">
            <div class="logout-modal-icon">
                <i class="fas fa-sign-out-alt"></i>
            </div>
            <p class="logout-modal-message">Are you sure you want to log out on your account?</p>
            <div class="logout-modal-actions">
                <button class="logout-action-btn cancel" id="cancelLogoutBtn">CANCEL</button>
                <button class="logout-action-btn confirm" id="confirmLogoutBtn">YES, LOGOUT</button>
            </div>
        </div>
    </div>
    <!-- ===== End of Logout Modal ===== --><!-- JavaScript Logic -->
     <script src="script/shared-data.js"></script>
    <script src="script/inventory_log.js"></script>

</body>
</html>
