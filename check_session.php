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
 * Checks for a valid "Remember Me" cookie and logs the user in.
 */
/**
 * Checks for a valid "Remember Me" cookie and logs the user in.
 */
function check_remember_me() {
    // --- DEBUGGING START ---
    error_log("--- check_remember_me called ---");
    if (isset($_SESSION['UserID'])) {
        error_log("User already logged in via session (UserID: " . $_SESSION['UserID'] . ")");
        return; // No need to check cookie if already logged in
    } else {
         error_log("No active session found.");
    }

    if (!isset($_COOKIE['remember_me'])) {
        error_log("Remember Me cookie not found.");
        return; // Cookie doesn't exist
    } else {
        error_log("Remember Me cookie found: " . $_COOKIE['remember_me']);
    }
    // --- DEBUGGING END ---


    // Only check if the user is NOT already logged in AND the cookie exists
    // (The session check above makes the first part redundant, but keep for clarity)
    if (!isset($_SESSION['UserID']) && isset($_COOKIE['remember_me'])) {
        
        // --- DEBUGGING START ---
        error_log("Attempting to validate Remember Me cookie.");
        // --- DEBUGGING END ---

        // Safely explode the cookie value
        $cookie_parts = explode(':', $_COOKIE['remember_me'], 2);
        if (count($cookie_parts) !== 2) {
             error_log("Cookie format invalid.");
             return; // Invalid cookie format
        }
        list($selector, $validator) = $cookie_parts;

        if ($selector && $validator) {
            // --- DEBUGGING START ---
            error_log("Selector: " . $selector . ", Validator: " . $validator);
            // --- DEBUGGING END ---

            include('db_connection.php'); // Establish $conn

            // Look up the selector in the database
            $sql = "SELECT * FROM auth_tokens WHERE selector = ? AND expires >= NOW() LIMIT 1";
            if ($stmt = $conn->prepare($sql)) {
                $stmt->bind_param("s", $selector);

                if ($stmt->execute()) {
                    $result = $stmt->get_result();

                    if ($token = $result->fetch_assoc()) {
                         // --- DEBUGGING START ---
                         error_log("Token found in DB for selector. UserID: " . $token['user_id'] . ", Expires: " . $token['expires']);
                         // --- DEBUGGING END ---

                        // We found a token. Now verify the validator.
                        if (password_verify($validator, $token['hashed_validator'])) {
                             // --- DEBUGGING START ---
                             error_log("Validator VERIFIED.");
                             // --- DEBUGGING END ---

                            // Valid token! Log the user in.
                            if (log_user_in($token['user_id'], $conn)) {
                                 // --- DEBUGGING START ---
                                 error_log("User successfully logged in via Remember Me (UserID: " . $token['user_id'] . ")");
                                 // --- DEBUGGING END ---
                            } else {
                                // --- DEBUGGING START ---
                                error_log("log_user_in function failed for UserID: " . $token['user_id']);
                                // --- DEBUGGING END ---
                            }

                            // OPTIONAL: Refresh the token for better security
                            // (This is a good practice but more complex)

                        } else {
                            // --- DEBUGGING START ---
                            error_log("Validator FAILED verification.");
                             // Optionally clear the invalid cookie
                             // setcookie('remember_me', '', time() - 3600, '/');
                            // --- DEBUGGING END ---
                        }
                    } else {
                         // --- DEBUGGING START ---
                         error_log("No valid (non-expired) token found in DB for selector.");
                          // Optionally clear the invalid cookie
                          // setcookie('remember_me', '', time() - 3600, '/');
                        // --- DEBUGGING END ---
                    }
                } else {
                    // --- DEBUGGING START ---
                    error_log("DB execute failed: " . $stmt->error);
                    // --- DEBUGGING END ---
                }
                $stmt->close();
            } else {
                 // --- DEBUGGING START ---
                 error_log("DB prepare failed: " . $conn->error);
                 // --- DEBUGGING END ---
            }
            $conn->close();
        } else {
            // --- DEBUGGING START ---
            error_log("Selector or Validator was empty after explode.");
            // --- DEBUGGING END ---
        }
    }
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