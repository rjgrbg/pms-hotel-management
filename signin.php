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

$redirect_map = [

    'admin'           => 'admin.php',

    'housekeeping_manager' => 'housekeeping.php',

    'housekeeping_staff'   => 'housekeeping_staff.php',

    'maintenance_manager'  => 'maintenance.php',

    'maintenance_staff'    => 'maintenance_staff.php',

    'parking_manager'      => 'parking.php',

    'default'              => 'index.php' // Fallback page

];

// ********************************



// --- Initialize response array ---

$response = ['success' => false, 'message' => 'Invalid request method.', 'redirect' => null];



if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // Use trim() to clean up whitespace from user input

    $username = trim($_POST['username'] ?? '');

    $password = $_POST['password'] ?? '';

    // Removed: $remember_me = isset($_POST['remember_me']) && $_POST['remember_me'] === 'on';



    if (empty($username) || empty($password)) {

        $response['message'] = "Both username and password are required.";

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



                        // Removed: Remember Me Handling Block



                        // --- Set success response and redirect URL ---

                        $response['success'] = true;

                        $response['message'] = 'Login successful.';

                        $response['redirect'] = $redirect_map[$user_type] ?? $redirect_map['default'];



                    } else {

                        // INCORRECT PASSWORD

                        $response['message'] = "Incorrect username or password.";

                    }

                } else {

                    // NO USER FOUND or MULTIPLE USERS FOUND 

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