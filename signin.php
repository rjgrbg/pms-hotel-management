<?php
// Set headers to prevent caching and ensure JSON/text response on error
// Use application/json for potential AJAX calls later
header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT'); // Date in the past

// Start session immediately, as it's needed for successful login
// Add session configuration for better security
session_start([
    'cookie_httponly' => true, // Prevents client-side script access
    'cookie_secure' => isset($_SERVER['HTTPS']), // Send cookie only over HTTPS if available
    'use_strict_mode' => true // Prevent session fixation attacks
]);

include('db_connection.php'); // Assumes this file correctly establishes $conn

// --- 1. Centralize Redirection Links ---
// ***** UPDATED THIS SECTION *****
$redirect_map = [
<<<<<<< Updated upstream
    'admin'           => 'admin.php',
    'housekeeping_manager' => 'housekeeping.html',
    'housekeeping_staff'   => 'housekeeping_staff.html',
    'maintenance_manager'  => 'maintenance.html', // Corrected spelling from 'maintenace'
=======

    'admin'           => 'admin.php',

    'housekeeping_manager' => 'housekeeping.php',

    'housekeeping_staff'   => 'housekeeping_staff.html',

    'maintenance_manager'  => 'maintenance.php',

>>>>>>> Stashed changes
    'maintenance_staff'    => 'maintenance_staff.html',
    'parking_manager'      => 'parking.html',
<<<<<<< Updated upstream
    'default'              => 'index.html' // Fallback page
=======

    'default'              => 'index.php' // Fallback page

>>>>>>> Stashed changes
];
// ********************************

// --- Initialize response array ---
$response = ['success' => false, 'message' => 'Invalid request method.', 'redirect' => null];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Use trim() to clean up whitespace from user input
    // Changed $_POST keys to match expected form field names (lowercase)
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $remember_me = isset($_POST['remember_me']) && $_POST['remember_me'] === 'on';

    if (empty($username) || empty($password)) {
        $response['message'] = "Both username and password are required.";
        // No need to close connection here, it will close at the end
    } else {
        // --- Use prepared statements consistently for security ---
        $sql = "SELECT UserID, Password, AccountType FROM users WHERE Username = ?";

        if ($stmt = $conn->prepare($sql)) {
            $stmt->bind_param("s", $username);

            if ($stmt->execute()) {
                $stmt->store_result();

                if ($stmt->num_rows === 1) { // Ensure exactly one user is found
                    $stmt->bind_result($id, $hashed_password, $user_type);
                    $stmt->fetch();

                    // --- Verify password ---
                    if (password_verify($password, $hashed_password)) {
                        // SUCCESSFUL LOGIN

                        // Regenerate session ID upon successful login to prevent session fixation
                        session_regenerate_id(true);

                        $_SESSION['UserID'] = $id;
                        $_SESSION['UserName'] = $username; // Store username
                        $_SESSION['UserType'] = $user_type;
                        // Add a timestamp for session timeout management
                        $_SESSION['login_time'] = time();

                        // --- Handle Remember Me Feature ---
                        if ($remember_me) {
                            // Generate secure tokens
                            $selector = bin2hex(random_bytes(16));
                            $validator = bin2hex(random_bytes(32));
                            $hashed_validator = password_hash($validator, PASSWORD_DEFAULT);
                            $expires = time() + (86400 * 30); // Expires in 30 days (Unix timestamp)

                            // --- Store token in a separate database table (Recommended) ---
                            // Make sure you have created the 'auth_tokens' table
                            $token_sql = "INSERT INTO auth_tokens (selector, hashed_validator, user_id, expires) VALUES (?, ?, ?, ?)";
                            if ($token_stmt = $conn->prepare($token_sql)) {
                                $expires_db_format = date('Y-m-d H:i:s', $expires); // Or store as BIGINT timestamp
                                $token_stmt->bind_param("ssis", $selector, $hashed_validator, $id, $expires_db_format); // Use 'i' for integer UserID
                                $token_stmt->execute();
                                $token_stmt->close();

                                // Set the secure, HTTP-only cookie
                                $cookie_value = $selector . ':' . $validator;
                                setcookie(
                                    'remember_me', // Cookie name
                                    $cookie_value,      // Combined token
                                    [
                                        'expires' => $expires,
                                        'path' => '/',
                                        'secure' => isset($_SERVER['HTTPS']), // Send only over HTTPS if available
                                        'httponly' => true, // ESSENTIAL: Prevents JavaScript access
                                        'samesite' => 'Lax' // Mitigates CSRF
                                    ]
                                );
                            } else {
                                // Log error: Failed to prepare statement for auth token
                                error_log("Failed to prepare auth token statement: " . $conn->error);
                            }
                        }

                        // --- Set success response and redirect URL ---
                        $response['success'] = true;
                        $response['message'] = 'Login successful.';
                        $response['redirect'] = $redirect_map[$user_type] ?? $redirect_map['default'];

                    } else {
                        // INCORRECT PASSWORD
                        $response['message'] = "Incorrect username or password.";
                    }
                } else {
                    // NO USER FOUND or MULTIPLE USERS FOUND (should not happen with unique username constraint)
                    $response['message'] = "Incorrect username or password.";
                }
            } else {
                // --- Execution failed ---
                $response['message'] = "Database error: Failed to execute query.";
                error_log("Signin query execution failed: " . $stmt->error); // Log the specific error
            }
            $stmt->close();
        } else {
            // --- Preparation failed ---
            $response['message'] = "Database error: Could not prepare statement.";
            error_log("Signin statement preparation failed: " . $conn->error); // Log the specific error
        }
    }
} else {
    // Invalid request method (already set in $response initialization)
    http_response_code(405); // Method Not Allowed
}

// --- Close connection ---
$conn->close();

// --- Send JSON response ---
echo json_encode($response);
exit(); // Ensure script stops here
?>