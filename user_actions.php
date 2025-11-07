<?php
// user_actions.php

// 'use' statements MUST be at the very top
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// --- Error Handling FIRST ---
error_reporting(E_ALL);
ini_set('display_errors', 0); 
ini_set('log_errors', 1);

// Set header AFTER 'use' statements
header('Content-Type: application/json');

// --- REQUIRED FOR EMAIL ---
// Load Composer's autoloader
require 'vendor/autoload.php';
// Include your email configuration
include('email_config.php');
// --- END OF EMAIL REQUIREMENTS ---

// Includes
// db_connection.php starts the session and provides get_db_connection()
include('db_connection.php'); 
// check_session.php provides require_login()
include('check_session.php'); 

// --- Define Allowed Account Types (from admin.php dropdown) ---
$allowed_account_types = [
    'admin',
    'housekeeping_manager',
    'housekeeping_staff',
    'maintenance_manager',
    'maintenance_staff',
    'inventory_manager',
    'parking_manager'
];

// --- HRIS Position to PMS AccountType Map ---
// This is the "translator"
$hris_to_pms_role_map = [
    'Admin' => 'admin',
    'Housekeeping Manager' => 'housekeeping_manager',
    'Housekeeper' => 'housekeeping_staff',
    'Senior Maintenance' => 'maintenance_manager',
    'Maintenance' => 'maintenance_staff',
    'Parking Attendant' => 'parking_manager',
];

// --- JSON Response Function ---
function send_json_response($success, $message, $data = null) {
    $response = ['success' => $success, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response);
    exit;
}

// Get the action
$action = $_POST['action'] ?? $_GET['action'] ?? null;

// Log the incoming request
error_log("user_actions.php called with action: " . ($action ?? 'NULL'));

if (!$action) {
    send_json_response(false, 'No action specified.');
}

// --- Main Action Switch ---
switch ($action) {

    // --- FETCH USERS (from PMS) ---
    case 'fetch_users':
        error_log("Fetching users - checking login status");
        
        // Check if user is logged in and is admin
        if (!isset($_SESSION['UserID'])) {
            error_log("No UserID in session");
            send_json_response(false, 'Not logged in. Please refresh the page.');
        }
        
        if (!isset($_SESSION['UserType']) || $_SESSION['UserType'] !== 'admin') {
            error_log("User type: " . ($_SESSION['UserType'] ?? 'not set'));
            send_json_response(false, 'Unauthorized access. Admin only.');
        }
        
        error_log("User authenticated, fetching data");
        
        $pms_conn = get_db_connection('pms'); // Get 'pms' connection
        if ($pms_conn === null) {
            error_log("PMS connection failed");
            send_json_response(false, 'Database connection error.');
        }

        error_log("Database connected, executing query");
        
        $sql = "SELECT UserID, EmployeeID, Fname, Lname, Mname, Birthday, AccountType, Username, EmailAddress, Shift, Address, ContactNumber FROM users ORDER BY Lname, Fname";
        $result = $pms_conn->query($sql);

        if ($result === false) {
             error_log("Database query error: " . $pms_conn->error);
             send_json_response(false, 'Database query error: ' . $pms_conn->error);
        } else {
             $users = $result->fetch_all(MYSQLI_ASSOC);
             error_log("Successfully fetched " . count($users) . " users");
             $result->free();
             send_json_response(true, 'Users fetched successfully.', $users);
        }
        break;

    // --- ADD EMPLOYEE FROM HRIS TO PMS ---
    case 'add_employee_by_id':
        // Check authentication
        if (!isset($_SESSION['UserID']) || $_SESSION['UserType'] !== 'admin') {
            send_json_response(false, 'Unauthorized access.');
        }
        
        $employee_id = trim($_POST['employeeId'] ?? '');
        if (empty($employee_id)) {
            send_json_response(false, 'Employee ID is required.');
        }

        // 1. Get connections for both databases
        $hris_conn = get_db_connection('hris');
        $pms_conn = get_db_connection('pms');

        if ($hris_conn === null || $pms_conn === null) {
            send_json_response(false, 'Database connection error.');
        }

        // 2. Check if user already exists in PMS
        $stmt_check = $pms_conn->prepare("SELECT UserID FROM users WHERE EmployeeID = ?");
        $stmt_check->bind_param("s", $employee_id);
        $stmt_check->execute();
        $stmt_check->store_result();
        if ($stmt_check->num_rows > 0) {
            $stmt_check->close();
            send_json_response(false, 'This employee is already registered in the PMS.');
        }
        $stmt_check->close();

        // 3. Fetch employee data from HRIS
        $stmt_hris = $hris_conn->prepare("SELECT Fname, Lname, Mname, Birthday, EmailAddress, Address, ContactNumber, Position FROM employees WHERE EmployeeID = ?");
        $stmt_hris->bind_param("s", $employee_id);
        $stmt_hris->execute();
        $result_hris = $stmt_hris->get_result();
        
        if ($employee = $result_hris->fetch_assoc()) {
            
            // 4. Map HRIS Position to PMS AccountType
            $hris_position = $employee['Position'];

            if (isset($hris_to_pms_role_map[$hris_position])) {
                $accountType = $hris_to_pms_role_map[$hris_position];
            } else {
                send_json_response(false, "Employee's position ('$hris_position') does not have a valid PMS role assigned. Please update the mapping in user_actions.php.");
            }

            // 5. Employee found, add them to PMS
            
            // --- *** MODIFIED SECTION *** ---
            // Username is now lastname.employeeid
            $username = strtolower($employee['Lname'] . '.' . $employee_id);
            // --- *** END MODIFIED SECTION *** ---

            // Generate a random password (user will have to reset)
            $default_password = password_hash(bin2hex(random_bytes(8)), PASSWORD_DEFAULT); 
            $default_shift = 'Morning'; // Admin can change this later
            
            // Generate Token for activation
            $token = bin2hex(random_bytes(32)); // 64-char hex token
            $token_expiry = date('Y-m-d H:i:s', strtotime('+24 hours')); // Token valid for 24 hours

            $sql_insert = "INSERT INTO users 
                            (EmployeeID, Fname, Lname, Mname, Birthday, AccountType, Username, Password, EmailAddress, Shift, Address, ContactNumber, ActivationToken, TokenExpiry) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt_insert = $pms_conn->prepare($sql_insert);
            $stmt_insert->bind_param("ssssssssssssss",
                $employee_id,
                $employee['Fname'],
                $employee['Lname'],
                $employee['Mname'],
                $employee['Birthday'],
                $accountType,
                $username,
                $default_password,
                $employee['EmailAddress'],
                $default_shift,
                $employee['Address'],
                $employee['ContactNumber'],
                $token,
                $token_expiry
            );

            if ($stmt_insert->execute()) {
                // --- 6. SEND ACTIVATION EMAIL ---
                $mail = new PHPMailer(true);
                $activation_link = BASE_URL . "activate.php?token=" . $token; 

                try {
                    // Server settings from email_config.php
                    $mail->isSMTP();
                    $mail->Host       = 'smtp.gmail.com';
                    $mail->SMTPAuth   = true;
                    $mail->Username   = GMAIL_EMAIL;
                    $mail->Password   = GMAIL_APP_PASSWORD;
                    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
                    $mail->Port       = 465;

                    // Recipients
                    $mail->setFrom(GMAIL_EMAIL, EMAIL_FROM_NAME);
                    $mail->addAddress($employee['EmailAddress'], $employee['Fname'] . ' ' . $employee['Lname']); 

                    // Content
                    $mail->isHTML(true);
                    $mail->Subject = 'Activate Your Celestia Hotel PMS Account';
                    $mail->Body    = "Dear {$employee['Fname']},<br><br>An account has been created for you in the Celestia Hotel Property Management System.<br><br>Your username is: <b>$username</b><br><br>Please click the link below to activate your account and set your password. This link is valid for 24 hours.<br><br><a href='$activation_link'>$activation_link</a><br><br>Sincerely,<br>The Celestia Hotel Team";
                    $mail->AltBody = "Welcome, {$employee['Fname']}. Your username is $username. Please visit this link to activate your account and set your password: $activation_link";

                    $mail->send();
                    send_json_response(true, "Success! User '$username' created. An activation email has been sent to {$employee['EmailAddress']}.");

                } catch (Throwable $e) {
                    $detailed_error = "Email Error: " . $e->getMessage() . " | Mailer Error: " . $mail->ErrorInfo;
                    error_log("PHPMailer Fatal Error for $username: " . $detailed_error);
                    send_json_response(true, "User '$username' was created, but the activation email could not be sent. Please check email config. Error: " . $mail->ErrorInfo);
                }
            } else {
                error_log("PMS Insert Error: " . $stmt_insert->error);
                if ($pms_conn->errno == 1062) {
                     send_json_response(false, "Failed to add employee: A user with username '$username' or that EmployeeID/Email already exists.");
                } else {
                     send_json_response(false, 'Failed to add employee to PMS.');
                }
            }
            $stmt_insert->close();

        } else {
            send_json_response(false, 'Employee ID not found in HRIS database.');
        }
        $stmt_hris->close();
        break;

    // --- SYNC USERS FROM HRIS ---
    case 'sync_users_from_hris':
        // Check authentication
        if (!isset($_SESSION['UserID']) || $_SESSION['UserType'] !== 'admin') {
            send_json_response(false, 'Unauthorized access.');
        }
        
        $hris_conn = get_db_connection('hris');
        $pms_conn = get_db_connection('pms');

        if ($hris_conn === null || $pms_conn === null) {
            send_json_response(false, 'Database connection error.');
        }

        // 1. Get all EmployeeIDs from PMS
        $pms_users = [];
        $result_pms = $pms_conn->query("SELECT EmployeeID FROM users WHERE EmployeeID IS NOT NULL AND EmployeeID != ''");
        if ($result_pms) {
            while ($row = $result_pms->fetch_assoc()) {
                $pms_users[] = $row['EmployeeID'];
            }
            $result_pms->free();
        }

        if (empty($pms_users)) {
            send_json_response(true, 'No PMS users found to sync.');
        }

        // 2. Fetch all corresponding users from HRIS
        $placeholders = implode(',', array_fill(0, count($pms_users), '?'));
        $types = str_repeat('s', count($pms_users));
        
        $sql_hris = "SELECT EmployeeID, Fname, Lname, Mname, Birthday, EmailAddress, Address, Position FROM employees WHERE EmployeeID IN ($placeholders)";
        $stmt_hris = $hris_conn->prepare($sql_hris);
        $stmt_hris->bind_param($types, ...$pms_users);
        $stmt_hris->execute();
        $result_hris = $stmt_hris->get_result();
        $hris_employees = [];
        while ($row = $result_hris->fetch_assoc()) {
            $hris_employees[$row['EmployeeID']] = $row;
        }
        $stmt_hris->close();
        
        // 3. Loop and update PMS
        $updated_count = 0;
        $failed_count = 0;
        
        $sql_update = "UPDATE users SET Fname = ?, Lname = ?, Mname = ?, Birthday = ?, EmailAddress = ?, Address = ?, AccountType = ? WHERE EmployeeID = ?";
        $stmt_update = $pms_conn->prepare($sql_update);

        foreach ($pms_users as $employee_id) {
            if (isset($hris_employees[$employee_id])) {
                $employee = $hris_employees[$employee_id];
                
                // Translate Position to AccountType
                $hris_position = $employee['Position'];
                if (isset($hris_to_pms_role_map[$hris_position])) {
                    $accountType = $hris_to_pms_role_map[$hris_position];
                } else {
                    error_log("Sync Skip: EmployeeID $employee_id has unknown HRIS position '$hris_position'");
                    $failed_count++;
                    continue; 
                }
                
                $stmt_update->bind_param("ssssssss",
                    $employee['Fname'],
                    $employee['Lname'],
                    $employee['Mname'],
                    $employee['Birthday'],
                    $employee['EmailAddress'],
                    $employee['Address'],
                    $accountType,
                    $employee_id
                );
                $stmt_update->execute();
                if ($stmt_update->affected_rows > 0) {
                    $updated_count++;
                }
            } else {
                error_log("Sync Skip: EmployeeID $employee_id in PMS but not found in HRIS.");
                $failed_count++;
            }
        }
        $stmt_update->close();
        
        send_json_response(true, "Sync complete. $updated_count users updated. $failed_count users skipped (check logs).");
        break;
        
    // --- EDIT USER (PMS-Specific Fields) ---
    case 'edit_user':
        // Check authentication
        if (!isset($_SESSION['UserID']) || $_SESSION['UserType'] !== 'admin') {
            send_json_response(false, 'Unauthorized access.');
        }
        
        $pms_conn = get_db_connection('pms');
        if ($pms_conn === null) {
            send_json_response(false, 'PMS Database connection error.');
        }

        $userID = filter_var($_POST['userID'] ?? null, FILTER_VALIDATE_INT);
        $username = trim($_POST['username'] ?? '');
        $accountType = trim($_POST['accountType'] ?? '');
        $shift = trim($_POST['shift'] ?? '');
        $password = trim($_POST['password'] ?? ''); // Get the optional password

        if ($userID === false) {
             send_json_response(false, 'Invalid User ID.');
        }
        
        if (empty($username) || empty($accountType) || empty($shift)) {
            send_json_response(false, 'Missing required fields (Username, Account Type, Shift).');
        }
        
        if (!in_array($accountType, $allowed_account_types)) {
            send_json_response(false, 'Invalid Account Type selected.');
        }

        // Check for duplicate username
        $stmt_check = $pms_conn->prepare("SELECT UserID FROM users WHERE Username = ? AND UserID != ?");
        $stmt_check->bind_param("si", $username, $userID);
        $stmt_check->execute();
        $stmt_check->store_result();
        if ($stmt_check->num_rows > 0) {
            $stmt_check->close();
            send_json_response(false, 'This username is already taken by another user.');
        }
        $stmt_check->close();

        // --- Build dynamic query ---
        $sql_parts = [];
        $params = [];
        $types = "";

        // Add required fields
        $sql_parts[] = "Username = ?";
        $params[] = $username;
        $types .= "s";

        $sql_parts[] = "AccountType = ?";
        $params[] = $accountType;
        $types .= "s";

        $sql_parts[] = "Shift = ?";
        $params[] = $shift;
        $types .= "s";

        // Add optional password
        if (!empty($password)) {
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            $sql_parts[] = "Password = ?";
            $params[] = $hashed_password;
            $types .= "s";
        }

        // Add the UserID for WHERE clause
        $params[] = $userID;
        $types .= "i";

        $sql_update = "UPDATE users SET " . implode(", ", $sql_parts) . " WHERE UserID = ?";
        $stmt_update = $pms_conn->prepare($sql_update);
        
        // Bind params dynamically
        $stmt_update->bind_param($types, ...$params);

        if ($stmt_update->execute()) {
             if ($stmt_update->affected_rows > 0) {
                 send_json_response(true, 'User updated successfully.');
             } else {
                 send_json_response(true, 'No changes were detected.');
             }
        } else {
            error_log("DB Execute Error (Update User): " . $stmt_update->error);
            send_json_response(false, 'Failed to update user.');
        }
        $stmt_update->close();
        break;

    // --- DELETE USER (from PMS) ---
    case 'delete_user':
        // Check authentication
        if (!isset($_SESSION['UserID']) || $_SESSION['UserType'] !== 'admin') {
            send_json_response(false, 'Unauthorized access.');
        }
        
        $pms_conn = get_db_connection('pms');
        if ($pms_conn === null) {
            send_json_response(false, 'PMS Database connection error.');
        }

        $userID = filter_var($_POST['userID'] ?? null, FILTER_VALIDATE_INT);

        if ($userID === false) {
            send_json_response(false, 'Invalid User ID provided.');
        }
        
        if (isset($_SESSION['UserID']) && $userID === (int)$_SESSION['UserID']) {
             send_json_response(false, 'You cannot delete your own account.');
        }

        $stmt_delete = $pms_conn->prepare("DELETE FROM users WHERE UserID = ?");
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

    default:
        send_json_response(false, 'Invalid action specified.');
        break;
}
?>