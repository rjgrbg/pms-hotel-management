<?php
// user_actions.php - ADD USERS FROM employees TABLE

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

error_reporting(E_ALL);
ini_set('display_errors', 0); 
ini_set('log_errors', 1);

header('Content-Type: application/json');

require 'vendor/autoload.php';
include('email_config.php');
include('db_connection.php'); 
include('check_session.php'); 

// --- Define Allowed Account Types ---
$allowed_account_types = [
    'admin',  
];

// --- Position Name to Account Type Mapping ---
$position_to_account_type = [
    'Administrator' => 'admin',
    'Housekeeping Manager' => 'housekeeping_manager',
    'House Keeping Staff' => 'housekeeping_staff',
    'Maintenance Manager' => 'maintenance_manager',
    'Maintenance Staff' => 'maintenance_staff',
    'Inventory Manager' => 'inventory_manager',
    'Parking Manager' => 'parking_manager'
];

function send_json_response($success, $message, $data = null) {
    $response = ['success' => $success, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    // --- SANITIZE (Not Needed) ---
    // This function sends JSON. It is inherently safe from XSS.
    // The client-side JS is responsible for sanitizing data if it renders to HTML.
    echo json_encode($response);
    exit;
}

// --- STRIP ---
$action = trim($_POST['action'] ?? $_GET['action'] ?? ''); // <-- REFINEMENT: Added trim() and default ''
error_log("user_actions.php called with action: " . ($action ?: 'NULL'));

if (empty($action)) { // Use empty() to check for ''
    send_json_response(false, 'No action specified.');
}

switch ($action) {

    // --- FETCH USERS (from PMS) ---
    case 'fetch_users':
        if (!isset($_SESSION['UserID']) || $_SESSION['UserType'] !== 'admin') {
            send_json_response(false, 'Unauthorized access. Admin only.');
        }
        
        $pms_conn = get_db_connection('b9wkqgu32onfqy0dvyva');
        if ($pms_conn === null) {
            send_json_response(false, 'Database connection error.');
        }
        
        // --- SECURE (No User Input) ---
        $sql = "SELECT UserID, EmployeeID, Fname, Lname, Mname, Birthday, AccountType, Username, EmailAddress, Shift, Address, ContactNumber FROM pms_users ORDER BY Lname, Fname";
        $result = $pms_conn->query($sql);

        if ($result === false) {
             error_log("Database query error: " . $pms_conn->error);
             send_json_response(false, 'Database query error: ' . $pms_conn->error);
        } else {
             $users = $result->fetch_all(MYSQLI_ASSOC);
             $result->free();
             send_json_response(true, 'Users fetched successfully.', $users);
        }
        break;

    // --- ADD USER FROM employees TABLE ---
    case 'add_user_from_employee':
        if (!isset($_SESSION['UserID']) || $_SESSION['UserType'] !== 'admin') {
            send_json_response(false, 'Unauthorized access.');
        }
        
        // --- STRIP ---
        $employee_code = trim($_POST['employeeCode'] ?? '');
        
        if (empty($employee_code)) {
            send_json_response(false, 'Employee Code is required.');
        }

        $pms_conn = get_db_connection('b9wkqgu32onfqy0dvyva');
        if ($pms_conn === null) {
            send_json_response(false, 'Database connection error.');
        }

        // --- SECURE (Prepared Statements) ---
        $stmt_check = $pms_conn->prepare("SELECT UserID FROM pms_users WHERE EmployeeID = ?");
        $stmt_check->bind_param("s", $employee_code);
        $stmt_check->execute();
        $stmt_check->store_result();
        if ($stmt_check->num_rows > 0) {
            $stmt_check->close();
            send_json_response(false, 'This employee is already registered in the system.');
        }
        $stmt_check->close();

        // --- SECURE (Prepared Statements) ---
        $sql_employee = "SELECT 
                e.employee_code,
                e.first_name,
                e.last_name,
                e.middle_name,
                e.birthdate,
                ee.email,
                ec.contact_number,
                ea.home_address,
                e.shift,
                jp.position_name
            FROM employees e
            LEFT JOIN employee_emails ee ON e.employee_id = ee.employee_id
            LEFT JOIN employee_contact_numbers ec ON e.employee_id = ec.employee_id
            LEFT JOIN employee_addresses ea ON e.employee_id = ea.employee_id
            LEFT JOIN job_positions jp ON e.position_id = jp.position_id
            WHERE e.employee_code = ?
            LIMIT 1";
        
        $stmt_emp = $pms_conn->prepare($sql_employee);
        $stmt_emp->bind_param("s", $employee_code);
        $stmt_emp->execute();
        $result_emp = $stmt_emp->get_result();
        
        if ($employee = $result_emp->fetch_assoc()) {
            
            // ... (rest of the logic is safe, variables are from DB) ...
            $position_name = $employee['position_name'];
            
            if (!isset($position_to_account_type[$position_name])) {
                $allowed_positions = implode(', ', array_keys($position_to_account_type));
                send_json_response(false, "Employee's position ('$position_name') is not allowed to access the PMS. Allowed positions: $allowed_positions");
            }
            
            $accountType = $position_to_account_type[$position_name];
            $username = strtolower($employee['last_name'] . '.' . $employee_code);
            
            // --- SECURE (Prepared Statements) ---
            $stmt_check_user = $pms_conn->prepare("SELECT UserID FROM pms_users WHERE Username = ?");
            $stmt_check_user->bind_param("s", $username);
            $stmt_check_user->execute();
            $stmt_check_user->store_result();
            if ($stmt_check_user->num_rows > 0) {
                $stmt_check_user->close();
                send_json_response(false, "Username '$username' is already taken.");
            }
            $stmt_check_user->close();

            $temp_password = password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);
            $token = bin2hex(random_bytes(32));
            $token_expiry = date('Y-m-d H:i:s', strtotime('+24 hours'));

            // --- SECURE (Prepared Statements) ---
            $sql_insert = "INSERT INTO pms_users 
                            (EmployeeID, Fname, Lname, Mname, Birthday, AccountType, Username, Password, 
                             EmailAddress, Shift, Address, ContactNumber, ActivationToken, TokenExpiry) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt_insert = $pms_conn->prepare($sql_insert);
            $stmt_insert->bind_param("ssssssssssssss",
                $employee_code,
                $employee['first_name'],
                $employee['last_name'],
                $employee['middle_name'],
                $employee['birthdate'],
                $accountType,
                $username,
                $temp_password,
                $employee['email'],
                $employee['shift'],
                $employee['home_address'],
                $employee['contact_number'],
                $token,
                $token_expiry
            );

            if ($stmt_insert->execute()) {
                // --- PHPMailer (Safe) ---
                $mail = new PHPMailer(true);
                $activation_link = BASE_URL . "activate.php?token=" . $token;

                try {
                    $mail->isSMTP();
                    $mail->Host       = 'smtp.gmail.com';
                    $mail->SMTPAuth   = true;
                    $mail->Username   = GMAIL_EMAIL;
                    $mail->Password   = GMAIL_APP_PASSWORD;
                    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
                    $mail->Port       = 465;

                    $mail->setFrom(GMAIL_EMAIL, EMAIL_FROM_NAME);
                    $mail->addAddress($employee['email'], $employee['first_name'] . ' ' . $employee['last_name']);

                    $mail->isHTML(true);
                    $mail->Subject = 'Activate Your Celestia Hotel PMS Account';
                    $mail->Body    = "Dear {$employee['first_name']},<br><br>An account has been created for you in the Celestia Hotel Property Management System.<br><br>Your username is: <b>$username</b><br><br>Please click the link below to activate your account and set your password. This link is valid for 24 hours.<br><br><a href='$activation_link'>$activation_link</a><br><br>Sincerely,<br>The Celestia Hotel Team";
                    $mail->AltBody = "Welcome, {$employee['first_name']}. Your username is $username. Please visit this link to activate your account and set your password: $activation_link";

                    $mail->send();
                    send_json_response(true, "Success! User '$username' created. An activation email has been sent to {$employee['email']}.");

                } catch (Throwable $e) {
                    error_log("PHPMailer Error for $username: " . $e->getMessage());
                    send_json_response(true, "User '$username' was created, but the activation email could not be sent. Error: " . $mail->ErrorInfo);
                }
            } else {
                error_log("PMS Insert Error: " . $stmt_insert->error);
                send_json_response(false, 'Failed to add user to PMS.');
            }
            $stmt_insert->close();

        } else {
            send_json_response(false, 'Employee Code not found in employees table.');
        }
        $stmt_emp->close();
        break;
        
    // --- EDIT USER (Password Only) ---
    case 'edit_user':
        if (!isset($_SESSION['UserID']) || $_SESSION['UserType'] !== 'admin') {
            send_json_response(false, 'Unauthorized access.');
        }
        
        $pms_conn = get_db_connection('b9wkqgu32onfqy0dvyva');
        if ($pms_conn === null) {
            send_json_response(false, 'PMS Database connection error.');
        }

        // --- STRIP & VALIDATE ---
        $userID = filter_var($_POST['userID'] ?? null, FILTER_VALIDATE_INT);
        $password = trim($_POST['password'] ?? ''); // Admin is setting password, trim is OK.

        if ($userID === false) {
             send_json_response(false, 'Invalid User ID.');
        }
        
        if (empty($password)) {
            send_json_response(false, 'Password is required.');
        }

        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        
        // --- SECURE (Prepared Statements) ---
        $sql_update = "UPDATE pms_users SET Password = ? WHERE UserID = ?";
        $stmt_update = $pms_conn->prepare($sql_update);
        $stmt_update->bind_param("si", $hashed_password, $userID);

        if ($stmt_update->execute()) {
             if ($stmt_update->affected_rows > 0) {
                 send_json_response(true, 'Password updated successfully.');
             } else {
                 send_json_response(false, 'No changes were made.');
             }
        } else {
            error_log("DB Execute Error (Update Password): " . $stmt_update->error);
            send_json_response(false, 'Failed to update password.');
        }
        $stmt_update->close();
        break;

    // --- DELETE USER ---
    case 'delete_user':
        if (!isset($_SESSION['UserID']) || $_SESSION['UserType'] !== 'admin') {
            send_json_response(false, 'Unauthorized access.');
        }
        
        $pms_conn = get_db_connection('b9wkqgu32onfqy0dvyva');
        if ($pms_conn === null) {
            send_json_response(false, 'PMS Database connection error.');
        }

        // --- VALIDATE ---
        $userID = filter_var($_POST['userID'] ?? null, FILTER_VALIDATE_INT);

        if ($userID === false) {
            send_json_response(false, 'Invalid User ID provided.');
        }
        
        if (isset($_SESSION['UserID']) && $userID === (int)$_SESSION['UserID']) {
             send_json_response(false, 'You cannot delete your own account.');
        }

        // --- SECURE (Prepared Statements) ---
        $stmt_delete = $pms_conn->prepare("DELETE FROM pms_users WHERE UserID = ?");
        $stmt_delete->bind_param("i", $userID);

        if ($stmt_delete->execute()) {
             if ($stmt_delete->affected_rows > 0) {
                 send_json_response(true, 'User deleted successfully from PMS.');
             } else {
                 send_json_response(false, 'User not found in PMS.');
             }
        } else {
             if ($stmt_delete->errno == 1451) {
                 send_json_response(false, 'Cannot delete user: They are referenced in other records (e.g., tasks, logs).');
             } else {
                  error_log("DB Execute Error (Delete User): " . $stmt_delete->error);
                 send_json_response(false, 'Failed to delete user.');
             }
        }
        $stmt_delete->close();
        break;

    // --- FETCH USER LOGS ---
    case 'fetch_user_logs':
        if (!isset($_SESSION['UserID']) || $_SESSION['UserType'] !== 'admin') {
            send_json_response(false, 'Unauthorized access.');
        }

        $pms_conn = get_db_connection('b9wkqgu32onfqy0dvyva');
        if ($pms_conn === null) {
            send_json_response(false, 'PMS Database connection error.');
        }

        // --- SECURE (No User Input) ---
        $sql = "SELECT
                    ul.LogID,
                    ul.ActionType,
                    ul.Timestamp,
                    u.UserID,
                    u.EmployeeID,
                    u.Fname,
                    u.Lname,
                    u.Mname,
                    u.AccountType,
                    u.Shift,
                    u.Username,
                    u.EmailAddress
                FROM
                    pms_user_logs ul
                JOIN
                    pms_users u ON ul.UserID = u.UserID
                ORDER BY
                    ul.LogID DESC";
        
        $result = $pms_conn->query($sql);

        if ($result === false) {
             error_log("Database query error (fetch logs): " . $pms_conn->error);
             send_json_response(false, 'Database query error: ' . $pms_conn->error);
        } else {
             $logs = $result->fetch_all(MYSQLI_ASSOC);
             $result->free();
             send_json_response(true, 'User logs fetched successfully.', $logs);
        }
        break;

    default:
        send_json_response(false, 'Invalid action specified.');
        break;
}
?>