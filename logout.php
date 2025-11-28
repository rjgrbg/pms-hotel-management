<?php

session_start([
    'cookie_httponly' => true,
    'cookie_secure' => isset($_SERVER['HTTPS']),
    'use_strict_mode' => true
]);

// --- LOG LOGOUT ACTION ---
require_once 'db_connection.php'; 

$conn = null;
if (function_exists('get_db_connection')) {
    $conn = get_db_connection('b9wkqgu32onfqy0dvyva');
}

if (isset($_SESSION['UserID']) && $conn) {
    try {
        $userID = $_SESSION['UserID'];
        $log_sql = "INSERT INTO pms_user_logs (UserID, ActionType) VALUES (?, 'Logged Out')";
        
        if ($log_stmt = $conn->prepare($log_sql)) {
            $log_stmt->bind_param("i", $userID);
            if (!$log_stmt->execute()) {
                error_log("Failed to write logout to user_logs: " . $log_stmt->error);
            }
            $log_stmt->close();
        } else {
             error_log("Failed to prepare logout statement: " . $conn->error);
        }
    } catch (Exception $e) {
        error_log("Failed to write logout to user_logs: " . $e->getMessage());
    }
    
    if ($conn) {
        $conn->close();
    }
}
// --- END OF LOGOUT BLOCK ---

// 1. Unset all session variables
$_SESSION = array();

// 2. Clear the "Remember Me" cookie
if (isset($_COOKIE['remember_me'])) {
    setcookie('remember_me', '', time() - 3600, '/', '', isset($_SERVER['HTTPS']), true);
}

// 3. Destroy the session
session_destroy();

// 4. Redirect to login page
header("Location: index.php?message=logged_out");
exit();
?>