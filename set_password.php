<?php
// set_password.php
// This script handles the password creation from activate.php
// It is very similar to reset_password.php but uses a token.

// Use secure session settings
session_start([
    'cookie_httponly' => true,
    'cookie_secure' => isset($_SERVER['HTTPS']),
    'use_strict_mode' => true
]);

include('db_connection.php');

// --- Response Setup ---
header('Content-Type: application/json');
$response = ['success' => false, 'message' => 'Invalid request.'];

// --- Security Check & Input Validation ---
if (
    $_SERVER['REQUEST_METHOD'] !== 'POST' ||
    !isset($_POST['token']) ||
    !isset($_POST['newPassword']) ||
    !isset($_POST['confirmPassword'])
) {
    http_response_code(400);
    echo json_encode($response);
    exit;
}

$token = trim($_POST['token']);
$newPassword = $_POST['newPassword'];
$confirmPassword = $_POST['confirmPassword'];

// --- Password Validation ---
if (empty($newPassword)) {
    $response['message'] = 'New password cannot be empty.';
    echo json_encode($response);
    exit;
}
if ($newPassword !== $confirmPassword) {
    $response['message'] = 'Passwords do not match.';
    echo json_encode($response);
    exit;
}

// Basic password strength check (Add more rules as needed, matching JS)
if (strlen($newPassword) < 8 || !preg_match('/[A-Z]/', $newPassword) || !preg_match('/[a-z]/', $newPassword) || !preg_match('/[0-9]/', $newPassword) || !preg_match('/[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]/', $newPassword)) {
     $response['message'] = 'Password does not meet all requirements.';
     echo json_encode($response);
     exit;
}

// --- Hash New Password ---
$hashed_password = password_hash($newPassword, PASSWORD_DEFAULT);
if ($hashed_password === false) {
    error_log("Password hashing failed.");
    $response['message'] = 'Error processing password. Please try again.';
    http_response_code(500);
    echo json_encode($response);
    exit;
}

// --- Update Database ---
// We find the user by their valid token, set their password,
// and simultaneously NULL the token so it can't be used again.
$sql = "UPDATE pms_users SET 
            Password = ?, 
            ActivationToken = NULL, 
            TokenExpiry = NULL 
        WHERE 
            ActivationToken = ? AND TokenExpiry > NOW()";
            
if ($stmt = $conn->prepare($sql)) {
    $stmt->bind_param("ss", $hashed_password, $token);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows === 1) {
            // Success!
            $response['success'] = true;
            $response['message'] = 'Password set successfully.';
        } else {
             // This means the token was invalid or expired
             $response['message'] = 'This activation link is invalid or has expired. Please contact your administrator to be added again.';
        }
    } else {
        error_log("DB Execute Error (Set Password): " . $stmt->error);
        $response['message'] = 'Database error setting password.';
        http_response_code(500);
    }
    $stmt->close();
} else {
    error_log("DB Prepare Error (Set Password): " . $conn->error);
    $response['message'] = 'Database error.';
    http_response_code(500);
}

$conn->close();
echo json_encode($response);
?>