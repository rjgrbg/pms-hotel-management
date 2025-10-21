<?php
// Start the session securely, using the same settings as signin.php
session_start([
    'cookie_httponly' => true,
    'cookie_secure' => isset($_SERVER['HTTPS']),
    'use_strict_mode' => true
]);

// 1. Unset all session variables
$_SESSION = array();

// 2. Clear the "Remember Me" cookie, if it exists
if (isset($_COOKIE['remember_me'])) {
    // Set the cookie to expire in the past
    setcookie('remember_me', '', time() - 3600, '/', '', isset($_SERVER['HTTPS']), true);
}

// 3. Destroy the session on the server
session_destroy();

// 4. Redirect the user back to the login page (index.php is recommended)
header("Location: index.php?message=logged_out");
exit(); // Ensure no other code runs
?>