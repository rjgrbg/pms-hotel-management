<?php
// user_actions.php - USER MANAGEMENT

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
    echo json_encode($response);
    exit;
}

$action = trim($_POST['action'] ?? $_GET['action'] ?? ''); 

if (empty($action)) { 
    send_json_response(false, 'No action specified.');
}

switch ($action) {

    // --- 1. FETCH USERS (All Users) ---
    case 'fetch_users':
        if (!isset($_SESSION['UserID']) || $_SESSION['UserType'] !== 'admin') {
            send_json_response(false, 'Unauthorized access. Admin only.');
        }
        
        $pms_conn = get_db_connection('b9wkqgu32onfqy0dvyva');
        if ($pms_conn === null) {
            send_json_response(false, 'Database connection error.');
        }
        
        // SYNC: Update pms_users details from employees table
        $sync_sql = "UPDATE pms_users p
            INNER JOIN employees e ON p.EmployeeID = e.employee_code
            LEFT JOIN employee_emails ee ON e.employee_id = ee.employee_id
            LEFT JOIN employee_contact_numbers ec ON e.employee_id = ec.employee_id
            LEFT JOIN employee_addresses ea ON e.employee_id = ea.employee_id
            SET 
                p.Fname = e.first_name,
                p.Lname = e.last_name,
                p.Mname = e.middle_name,
                p.Birthday = e.birthdate,
                p.Shift = e.shift,
                p.EmailAddress = COALESCE(NULLIF(ee.email, ''), p.EmailAddress),
                p.ContactNumber = COALESCE(NULLIF(ec.contact_number, ''), p.ContactNumber),
                p.Address = COALESCE(NULLIF(ea.home_address, ''), p.Address)
            WHERE p.EmployeeID IS NOT NULL AND p.EmployeeID != ''";
            
        $pms_conn->query($sync_sql);

        $sql = "SELECT UserID, EmployeeID, Fname, Lname, Mname, Birthday, AccountType, Username, EmailAddress, Shift, Address, ContactNumber, is_archived 
                FROM pms_users 
                ORDER BY is_archived ASC, Lname ASC, Fname ASC"; 
        
        $result = $pms_conn->query($sql);

        if ($result === false) {
             send_json_response(false, 'Database query error: ' . $pms_conn->error);
        } else {
             $users = $result->fetch_all(MYSQLI_ASSOC);
             $result->free();
             send_json_response(true, 'Users fetched successfully.', $users);
        }
        break;

    // --- 2. FETCH AVAILABLE EMPLOYEES (For Add User List) ---
    case 'fetch_available_employees':
        if (!isset($_SESSION['UserID']) || $_SESSION['UserType'] !== 'admin') {
            send_json_response(false, 'Unauthorized access.');
        }

        $pms_conn = get_db_connection('b9wkqgu32onfqy0dvyva');
        
        // Prepare list of allowed positions for SQL IN clause
        $allowed_positions = array_keys($position_to_account_type);
        $escaped_positions = array_map(function($pos) use ($pms_conn) {
            return "'" . $pms_conn->real_escape_string($pos) . "'";
        }, $allowed_positions);
        $positions_str = implode(',', $escaped_positions);

        // Select active employees who have an allowed position AND are NOT yet in pms_users
        $sql = "SELECT 
                    e.employee_code, 
                    e.first_name, 
                    e.last_name, 
                    jp.position_name 
                FROM employees e
                JOIN job_positions jp ON e.position_id = jp.position_id
                LEFT JOIN pms_users u ON e.employee_code = u.EmployeeID
                WHERE 
                    e.status = 'active' AND
                    jp.position_name IN ($positions_str) AND
                    u.UserID IS NULL
                ORDER BY e.last_name, e.first_name";

        $result = $pms_conn->query($sql);
        
        if ($result) {
            $employees = $result->fetch_all(MYSQLI_ASSOC);
            send_json_response(true, 'Employees fetched.', $employees);
        } else {
            send_json_response(false, 'DB Error: ' . $pms_conn->error);
        }
        break;

    // --- 3. ADD USER ---
    case 'add_user_from_employee':
        if (!isset($_SESSION['UserID']) || $_SESSION['UserType'] !== 'admin') {
            send_json_response(false, 'Unauthorized access.');
        }
        
        $employee_code = trim($_POST['employeeCode'] ?? '');
        
        if (empty($employee_code)) {
            send_json_response(false, 'Employee Code is required.');
        }

        $pms_conn = get_db_connection('b9wkqgu32onfqy0dvyva');
        
        // Double check existence
        $stmt_check = $pms_conn->prepare("SELECT UserID, is_archived FROM pms_users WHERE EmployeeID = ?");
        $stmt_check->bind_param("s", $employee_code);
        $stmt_check->execute();
        $res_check = $stmt_check->get_result();
        
        if ($res_check->num_rows > 0) {
            $row = $res_check->fetch_assoc();
            $stmt_check->close();
            if ($row['is_archived'] == 1) {
                send_json_response(false, 'This user exists but is archived. Please restore them from the list.');
            }
            send_json_response(false, 'This employee is already registered.');
        }
        $stmt_check->close();

        // Fetch Employee Data
        $sql_employee = "SELECT e.employee_code, e.first_name, e.last_name, e.middle_name, e.birthdate, ee.email, ec.contact_number, ea.home_address, e.shift, jp.position_name
            FROM employees e
            LEFT JOIN employee_emails ee ON e.employee_id = ee.employee_id
            LEFT JOIN employee_contact_numbers ec ON e.employee_id = ec.employee_id
            LEFT JOIN employee_addresses ea ON e.employee_id = ea.employee_id
            LEFT JOIN job_positions jp ON e.position_id = jp.position_id
            WHERE e.employee_code = ? LIMIT 1";
        
        $stmt_emp = $pms_conn->prepare($sql_employee);
        $stmt_emp->bind_param("s", $employee_code);
        $stmt_emp->execute();
        $result_emp = $stmt_emp->get_result();
        
        if ($employee = $result_emp->fetch_assoc()) {
            
            $position_name = $employee['position_name'];
            if (!isset($position_to_account_type[$position_name])) {
                send_json_response(false, "Position '$position_name' is not allowed to access PMS.");
            }
            
            $accountType = $position_to_account_type[$position_name];
            $username = strtolower($employee['last_name'] . '.' . $employee_code);
            
            // Validate Username Unique
            $stmt_check_user = $pms_conn->prepare("SELECT UserID FROM pms_users WHERE Username = ?");
            $stmt_check_user->bind_param("s", $username);
            $stmt_check_user->execute();
            if ($stmt_check_user->get_result()->num_rows > 0) {
                $stmt_check_user->close();
                send_json_response(false, "Username '$username' is already taken.");
            }
            $stmt_check_user->close();

            $temp_password = password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);
            $token = bin2hex(random_bytes(32));
            $token_expiry = date('Y-m-d H:i:s', strtotime('+24 hours'));

           $sql_insert = "INSERT INTO pms_users 
                            (EmployeeID, Fname, Lname, Mname, Birthday, AccountType, Username, Password, 
                             EmailAddress, Shift, Address, ContactNumber, ActivationToken, TokenExpiry, AvailabilityStatus, is_archived) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Offline', 0)";
            
            $stmt_insert = $pms_conn->prepare($sql_insert);
            $stmt_insert->bind_param("ssssssssssssss",
                $employee_code, $employee['first_name'], $employee['last_name'], $employee['middle_name'], $employee['birthdate'],
                $accountType, $username, $temp_password, $employee['email'], $employee['shift'],
                $employee['home_address'], $employee['contact_number'], $token, $token_expiry
            );

            if ($stmt_insert->execute()) {
                // Email Logic
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
                    $mail->addAddress($employee['email'], $employee['first_name']);
                    $mail->isHTML(true);
                    $mail->Subject = 'Activate Your Celestia Hotel PMS Account';
                    $mail->Body    = "Username: <b>$username</b><br><a href='$activation_link'>Activate Account</a>";
                    $mail->send();
                    send_json_response(true, "User '$username' created. Activation email sent.");
                } catch (Throwable $e) {
                    send_json_response(true, "User created, but email failed: " . $mail->ErrorInfo);
                }
            } else {
                send_json_response(false, 'Failed to add user to PMS.');
            }
            $stmt_insert->close();
        } else {
            send_json_response(false, 'Employee Code not found.');
        }
        $stmt_emp->close();
        break;
        
    // --- 4. EDIT USER ---
    case 'edit_user':
        if (!isset($_SESSION['UserID']) || $_SESSION['UserType'] !== 'admin') {
            send_json_response(false, 'Unauthorized access.');
        }
        $pms_conn = get_db_connection('b9wkqgu32onfqy0dvyva');
        $userID = filter_var($_POST['userID'] ?? null, FILTER_VALIDATE_INT);
        $password = trim($_POST['password'] ?? '');

        if (!$userID || empty($password)) send_json_response(false, 'Invalid input.');

        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pms_conn->prepare("UPDATE pms_users SET Password = ? WHERE UserID = ?");
        $stmt->bind_param("si", $hashed_password, $userID);

        if ($stmt->execute()) {
             send_json_response(true, 'Password updated successfully.');
        } else {
            send_json_response(false, 'Failed to update password.');
        }
        $stmt->close();
        break;

    // --- 5. ARCHIVE USER ---
    case 'archive_user': 
        if (!isset($_SESSION['UserID']) || $_SESSION['UserType'] !== 'admin') {
            send_json_response(false, 'Unauthorized access.');
        }
        
        $pms_conn = get_db_connection('b9wkqgu32onfqy0dvyva');
        $userID = filter_var($_POST['userID'] ?? null, FILTER_VALIDATE_INT);

        if ($userID === false) send_json_response(false, 'Invalid User ID.');
        
        if (isset($_SESSION['UserID']) && $userID === (int)$_SESSION['UserID']) {
             send_json_response(false, 'You cannot archive your own account.');
        }

        $stmt_archive = $pms_conn->prepare("UPDATE pms_users SET is_archived = 1 WHERE UserID = ?");
        $stmt_archive->bind_param("i", $userID);

        if ($stmt_archive->execute()) {
             send_json_response(true, 'User archived successfully.');
        } else {
             send_json_response(false, 'Failed to archive user.');
        }
        $stmt_archive->close();
        break;

    // --- 6. RESTORE USER ---
    case 'restore_user': 
        if (!isset($_SESSION['UserID']) || $_SESSION['UserType'] !== 'admin') {
            send_json_response(false, 'Unauthorized access.');
        }
        
        $pms_conn = get_db_connection('b9wkqgu32onfqy0dvyva');
        $userID = filter_var($_POST['userID'] ?? null, FILTER_VALIDATE_INT);

        if ($userID === false) send_json_response(false, 'Invalid User ID.');

        $stmt_restore = $pms_conn->prepare("UPDATE pms_users SET is_archived = 0 WHERE UserID = ?");
        $stmt_restore->bind_param("i", $userID);

        if ($stmt_restore->execute()) {
             send_json_response(true, 'User restored successfully.');
        } else {
             send_json_response(false, 'Failed to restore user.');
        }
        $stmt_restore->close();
        break;

    // --- 7. FETCH LOGS ---
    case 'fetch_user_logs':
        if (!isset($_SESSION['UserID']) || $_SESSION['UserType'] !== 'admin') {
            send_json_response(false, 'Unauthorized access.');
        }
        $pms_conn = get_db_connection('b9wkqgu32onfqy0dvyva');
        $sql = "SELECT ul.LogID, ul.ActionType, ul.Timestamp, u.UserID, u.EmployeeID, u.Fname, u.Lname, u.Mname, u.AccountType, u.Shift, u.Username, u.EmailAddress
                FROM pms_user_logs ul JOIN pms_users u ON ul.UserID = u.UserID ORDER BY ul.LogID DESC";
        $result = $pms_conn->query($sql);
        if ($result) {
             send_json_response(true, 'Logs fetched.', $result->fetch_all(MYSQLI_ASSOC));
        } else {
             send_json_response(false, 'DB Error.');
        }
        break;

    default:
        send_json_response(false, 'Invalid action specified.');
        break;
}
?>