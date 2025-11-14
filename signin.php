<?php
// pms-hotel-management/signin.php

// Set headers to prevent caching and ensure JSON/text response on error
header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT'); // Date in the past

// Start session immediately
session_start([
    'cookie_httponly' => true,
    'cookie_secure' => isset($_SERVER['HTTPS']),
    'use_strict_mode' => true
]);

// --- Database Connection (Using the correct function-based method) ---
try {
    require_once 'db_connection.php'; 
    $conn = get_db_connection('pms'); 
    
    if ($conn === null) {
        throw new Exception('get_db_connection("pms") returned null.');
    }
    if ($conn->connect_error) {
         throw new Exception('Connection failed: '. $conn->connect_error);
    }

} catch (Exception $e) {
    error_log('Login DB Error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database connection failed. Please check server logs.']);
    exit();
}
// ---------------------------

$response = ['success' => false, 'message' => 'Invalid request method.', 'redirect' => null];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // --- STRIPPING INPUTS ---
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? ''); // <-- REFINEMENT: Added trim()
    
    if (empty($username) || empty($password)) {
        $response['message'] = "Both username and password are required.";
    } else {
        // --- SECURE SQL (Prepared Statement) ---
        $sql = "SELECT UserID, Password, AccountType FROM pms_users WHERE Username = ?";

        if ($stmt = $conn->prepare($sql)) {
            $stmt->bind_param("s", $username);

            if ($stmt->execute()) {
                
                // Get the result as an object
                $result = $stmt->get_result();
                $user = $result->fetch_assoc();
                
                // We MUST close the first statement *immediately* after fetching
                // This prevents database lock errors before the next query.
                $stmt->close();

                // --- SECURE PASSWORD CHECK ---
                if ($user && password_verify($password, $user['Password'])) {
                    // SUCCESSFUL LOGIN
                    session_regenerate_id(true); // Prevents session fixation

                    // Use the $user array we already fetched
                    $_SESSION['UserID'] = $user['UserID'];
                    $_SESSION['UserName'] = $username;
                    $_SESSION['UserType'] = $user['AccountType'];
                    $_SESSION['login_time'] = time();

                    // --- LOGGING BLOCK ---
                    $log_error = null;
                    try {
                        // This query will now work!
                        $log_sql = "INSERT INTO user_logs (UserID, ActionType) VALUES (?, 'Logged In')";
                        if ($log_stmt = $conn->prepare($log_sql)) {
                            // Use the UserID from the $user array
                            $log_stmt->bind_param("i", $user['UserID']); 
                            if (!$log_stmt->execute()) {
                                $log_error = "Log Execute Error: " . $log_stmt->error;
                            }
                            $log_stmt->close();
                        } else {
                            $log_error = "Log Prepare Error: " . $conn->error;
                        }
                    } catch (Exception $e) {
                        $log_error = "Log Exception: " . $e->getMessage();
                    }
                    // --- END OF LOGGING BLOCK ---

                    $response['success'] = true;
                    $response['message'] = 'Login successful.';
                    $response['redirect'] = 'inventory_log.php'; // Redirect target

                    if ($log_error !== null) {
                        $response['log_error'] = $log_error;
                        error_log($log_error); // Also write to server log
                    }

                } else {
                    // NO USER FOUND or INCORRECT PASSWORD
                    $response['message'] = "Incorrect username or password.";
                }
            } else {
                $response['message'] = "Database error: Failed to execute query.";
                error_log("Signin query execution failed: " . $stmt->error);
                if ($stmt) {
                    $stmt->close();
                }
            }
        } else {
            $response['message'] = "Database error: Could not prepare statement.";
            error_log("Signin statement preparation failed: " . $conn->error);
        }
    }
} else {
    // Not a POST request
    http_response_code(405);
    $response['message'] = 'Invalid request method. Only POST is allowed.';
}

$conn->close();
echo json_encode($response);
exit();
?>