<?php
// Use secure session settings
session_start([
    'cookie_httponly' => true,
    'cookie_secure' => isset($_SERVER['HTTPS']),
    'use_strict_mode' => true,
    'gc_maxlifetime' => 600 // Match other scripts
]);

include('db_connection.php');

// --- Response Setup ---
header('Content-Type: application/json');
$response = ['success' => false, 'message' => 'Invalid request.'];

// --- Security Check & Input Validation ---
if (
    $_SERVER['REQUEST_METHOD'] !== 'POST' ||
    !isset($_SESSION['otp_verified']) || $_SESSION['otp_verified'] !== true || // Check if OTP was verified
    !isset($_SESSION['otp_email']) ||                                          // Check if email is in session
    !isset($_POST['newPassword']) ||
    !isset($_POST['confirmPassword'])
) {
    http_response_code(400);
    // Clear potentially compromised session data
    unset($_SESSION['otp'], $_SESSION['otp_email'], $_SESSION['otp_expiry'], $_SESSION['otp_type'], $_SESSION['otp_verified']);
    echo json_encode($response);
    exit;
}

$email = $_SESSION['otp_email'];
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
if (strlen($newPassword) < 8) {
     $response['message'] = 'Password must be at least 8 characters long.';
     echo json_encode($response);
     exit;
}
// Add checks for uppercase, lowercase, number, special char if desired

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
$sql = "UPDATE users SET Password = ? WHERE EmailAddress = ?";
if ($stmt = $conn->prepare($sql)) {
    $stmt->bind_param("ss", $hashed_password, $email);
    if ($stmt->execute()) {
        if ($stmt->affected_rows === 1) {
            $response['success'] = true;
            $response['message'] = 'Password updated successfully.';
            // Clear all OTP session data now that it's used
            unset($_SESSION['otp'], $_SESSION['otp_email'], $_SESSION['otp_expiry'], $_SESSION['otp_type'], $_SESSION['otp_verified']);
        } else {
             // Should not happen if email was validated earlier, but good to check
             $response['message'] = 'Could not update password for the specified email.';
             error_log("Password reset failed for email: $email. Affected rows: " . $stmt->affected_rows);
        }
    } else {
        error_log("DB Execute Error (Update Password): " . $stmt->error);
        $response['message'] = 'Database error updating password.';
        http_response_code(500);
    }
    $stmt->close();
} else {
    error_log("DB Prepare Error (Update Password): " . $conn->error);
    $response['message'] = 'Database error.';
    http_response_code(500);
}

$conn->close();
echo json_encode($response);
?>