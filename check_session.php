<?php
// Use the exact same secure session settings as your signin.php
session_start([
    'cookie_httponly' => true,
    'cookie_secure' => isset($_SERVER['HTTPS']),
    'use_strict_mode' => true
]);

/**
 * Logs in a user based on their UserID.
 * @param int $user_id The UserID from the 'users' table.
 * @param object $conn The database connection object.
 */
function log_user_in($user_id, $conn) {
    // Fetch user details
    $sql = "SELECT UserID, Username, AccountType FROM users WHERE UserID = ?";
    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($user = $result->fetch_assoc()) {
            
            // Regenerate session ID for security
            session_regenerate_id(true);

            // Store user data in the session
            $_SESSION['UserID'] = $user['UserID'];
            $_SESSION['UserName'] = $user['Username'];
            $_SESSION['UserType'] = $user['AccountType'];
            $_SESSION['login_time'] = time();
            
            $stmt->close();
            return true;
        }
        $stmt->close();
    }
    return false;
}
/**
 * Checks if a user is logged in and (optionally) has the correct role.
 * If not, it redirects them to the login page and stops the script.
 *
 * @param array $allowed_roles An array of 'AccountType' strings that are allowed.
 * If empty, any logged-in user is allowed.
 */
function require_login($allowed_roles = []) {
    
    // Check 1: Is the user logged in at all?
    if (!isset($_SESSION['UserID'])) {
        // Not logged in. Redirect to login page.
        header("Location: index.php"); // Redirect to .php
        exit();
    }

    // Check 2: (Optional) Check for session timeout
    $timeout_duration = 1800; // 30 minutes (in seconds)
    if (isset($_SESSION['login_time']) && (time() - $_SESSION['login_time']) > $timeout_duration) {
        // Session has expired. Destroy it and redirect to login.
        session_unset();
        session_destroy();
        header("Location: index.php?message=session_expired");
        exit();
    }

    // Check 3: Does the user have the correct role for *this* page?
    if (!empty($allowed_roles)) {
        $user_type = $_SESSION['UserType'] ?? 'guest'; // Get user's role
        
        // If their role is NOT in the list of allowed roles...
        if (!in_array($user_type, $allowed_roles)) {
            // Unauthorized. Redirect to login
            header("Location: index.php?error=unauthorized");
            exit();
        }
    }

    // If all checks pass, reset the session timer (sliding expiration)
    $_SESSION['login_time'] = time();
}
?>