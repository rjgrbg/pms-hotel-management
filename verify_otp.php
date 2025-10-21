<?php
// Use secure session settings
session_start([
    'cookie_httponly' => true,
    'cookie_secure' => isset($_SERVER['HTTPS']),
    'use_strict_mode' => true,
    'gc_maxlifetime' => 600 // Match send_otp timeout
]);

include('db_connection.php');

// --- Response Setup ---
header('Content-Type: application/json');
$response = ['success' => false, 'message' => 'Invalid request.', 'username' => null];

// --- Input Validation ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_POST['otp'])) {
    http_response_code(400);
    echo json_encode($response);
    exit;
}

$entered_otp = trim($_POST['otp']);

// --- Check Session Data ---
if (
    !isset($_SESSION['otp']) ||
    !isset($_SESSION['otp_email']) ||
    !isset($_SESSION['otp_expiry']) ||
    !isset($_SESSION['otp_type'])
) {
    $response['message'] = 'OTP session data missing or expired. Please request a new OTP.';
    echo json_encode($response);
    exit;
}

// --- Check Expiry ---
if (time() > $_SESSION['otp_expiry']) {
    // Clear expired OTP data
    unset($_SESSION['otp'], $_SESSION['otp_email'], $_SESSION['otp_expiry'], $_SESSION['otp_type'], $_SESSION['otp_verified']);
    $response['message'] = 'OTP has expired. Please request a new one.';
    echo json_encode($response);
    exit;
}

// --- Verify OTP ---
if ($entered_otp == $_SESSION['otp']) { // Use == for loose comparison as types might differ
    $response['success'] = true;
    $response['message'] = 'OTP verified successfully.';
    $_SESSION['otp_verified'] = true; // Flag for password reset step

    // If it was for username recovery, fetch the username
    if ($_SESSION['otp_type'] === 'username') {
        $email = $_SESSION['otp_email'];
        $sql = "SELECT Username FROM users WHERE EmailAddress = ?";
        if ($stmt = $conn->prepare($sql)) {
            $stmt->bind_param("s", $email);
            if ($stmt->execute()) {
                $result = $stmt->get_result();
                if ($user = $result->fetch_assoc()) {
                    $response['username'] = $user['Username'];
                } else {
                    $response['success'] = false; // Should not happen if send_otp checked first
                    $response['message'] = 'Could not find username for this email.';
                }
            } else {
                 error_log("DB Execute Error (Get Username): " . $stmt->error);
                 $response['success'] = false;
                 $response['message'] = 'Database error fetching username.';
            }
            $stmt->close();
        } else {
             error_log("DB Prepare Error (Get Username): " . $conn->error);
             $response['success'] = false;
             $response['message'] = 'Database error.';
        }
        // Clear session data after use for username recovery
        unset($_SESSION['otp'], $_SESSION['otp_email'], $_SESSION['otp_expiry'], $_SESSION['otp_type'], $_SESSION['otp_verified']);
    }
    // For password reset, keep session data until password is changed

} else {
    $response['message'] = 'Invalid OTP entered.';
}

$conn->close();
echo json_encode($response);
?>