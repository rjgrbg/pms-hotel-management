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
    header("Location: inventory_log_signin.php");
    exit();
}

// If they ARE logged in, the rest of the page will load.
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Celestia Hotel - Housekeeping Management</title>
  <link rel="stylesheet" href="css/housekeeping.css">
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
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Celestia Hotel - Housekeeping Management</title>
  <link rel="stylesheet" href="css/housekeeping.css">
</head>
<body>
  <!-- Header -->
  <header class="header">
    <div class="headerLeft">
      <img src="assets/images/celestia-logo.png" alt="Logo" class="headerLogo" />
      <span class="hotelName">THE CELESTIA HOTEL</span>
      <link rel="stylesheet" href="css/inventory_log_page.css">
    </div>

    <!-- profile sidebar -->
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
  <!-- Logout Confirmation Modal -->
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
<!-- Main Container -->
  <div class="mainContainer">
    <h1>Inventory Log</h1>
    <p>Welcome to the Inventory Log System.</p>
  <form action="inventory_log_logout.php" method="POST" style="display: inline;">
    <button type="submit" class="logout-button">Logout</button>
  </form>

  <!-- 
  You can add this basic styling to your css/inventory_log.css file 
  to make the button look good.
-->
  <style>
    .logout-button {
      padding: 0.5rem 1rem;
      font-family: Arial, sans-serif;
      font-weight: bold;
      color: #FFA237;
      background-color: #6a2424;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .logout-button:hover {
      background-color: #853838;
    }
  </style>
   <script src="script/inventory_log.js"></script>
</body>
</html>