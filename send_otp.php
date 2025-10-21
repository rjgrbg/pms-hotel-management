<?php
// Use secure session settings
session_start([
    'cookie_httponly' => true,
    'cookie_secure' => isset($_SERVER['HTTPS']),
    'use_strict_mode' => true,
    'gc_maxlifetime' => 600 // Set session timeout (e.g., 10 minutes for OTP)
]);

// Include necessary files
require 'vendor/autoload.php';
include('db_connection.php');
include('email_config.php');

// Use PHPMailer classes
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// --- Response Setup ---
header('Content-Type: application/json');
$response = ['success' => false, 'message' => 'Invalid request.'];

// --- Input Validation ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_POST['email']) || !isset($_POST['type'])) {
    http_response_code(400); // Bad Request
    echo json_encode($response);
    exit;
}

$email = filter_var(trim($_POST['email']), FILTER_VALIDATE_EMAIL);
$type = $_POST['type']; // 'username' or 'password'

if (!$email) {
    $response['message'] = 'Invalid email address.';
    echo json_encode($response);
    exit;
}
if ($type !== 'username' && $type !== 'password') {
     $response['message'] = 'Invalid recovery type.';
     echo json_encode($response);
     exit;
}

// --- MODIFIED BLOCK: Check if email exists in database ---
$sql = "SELECT UserID FROM users WHERE EmailAddress = ?";
if ($stmt = $conn->prepare($sql)) {
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows === 0) {
        // **THIS IS THE CHANGE**
        // Now, we explicitly tell the user the email is not found
        // and stop the script.
        $response['success'] = false;
        $response['message'] = 'This email is not registered with an account.';
        echo json_encode($response);
        $stmt->close();
        $conn->close();
        exit; 
    }
    // If we get here, the email *was* found, so we continue.
    $stmt->close();
} else {
    error_log("DB Prepare Error (Check Email): " . $conn->error);
    $response['message'] = 'Database error. Please try again later.';
    http_response_code(500);
    echo json_encode($response);
    $conn->close();
    exit;
}
// --- END OF MODIFIED BLOCK ---


// --- Generate and Store OTP ---
// This code will only run if the email was found.
$otp = random_int(100000, 999999); // Generate a 6-digit OTP
$otp_expiry = time() + 600; // OTP valid for 10 minutes

// Store OTP, expiry, and email in session
$_SESSION['otp'] = $otp;
$_SESSION['otp_email'] = $email;
$_SESSION['otp_expiry'] = $otp_expiry;
$_SESSION['otp_type'] = $type; // Remember why we sent the OTP

// --- Send Email ---
$mail = new PHPMailer(true);

try {
    // Server settings
    // $mail->SMTPDebug = SMTP::DEBUG_SERVER; // Enable verbose debug output for testing
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = GMAIL_EMAIL;
    $mail->Password   = GMAIL_APP_PASSWORD;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // Use SSL/TLS
    $mail->Port       = 465;                      // TCP port for SSL/TLS

    // Recipients
    $mail->setFrom(GMAIL_EMAIL, EMAIL_FROM_NAME);
    $mail->addAddress($email); // Add recipient

    // Content
    $mail->isHTML(true);
    $subject = ($type === 'username') ? 'Recover Your Username - Celestia Hotel' : 'Reset Your Password - Celestia Hotel';
    $mail->Subject = $subject;
    $mail->Body    = "Dear User,<br><br>Your One-Time Password (OTP) for account recovery is: <b>$otp</b><br><br>This code will expire in 10 minutes.<br><br>If you did not request this, please ignore this email.<br><br>Sincerely,<br>The Celestia Hotel Team";
    $mail->AltBody = "Your One-Time Password (OTP) is: $otp. It expires in 10 minutes.";

    $mail->send();
    $response['success'] = true;
    $response['message'] = 'An OTP has been sent to your email address.';

} catch (Exception $e) {
    error_log("Mailer Error: {$mail->ErrorInfo}");
    $response['message'] = "Message could not be sent. Please try again later."; // Generic error for user
    http_response_code(500);
}

$conn->close();
echo json_encode($response);
?>