<?php
// user_actions.php - USER MANAGEMENT

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

error_reporting(E_ALL);
ini_set('display_errors', 1); 
ini_set('log_errors', 1);

header('Content-Type: application/json');

require 'vendor/autoload.php';
include('email_config.php');
include('db_connection.php'); 
include('check_session.php'); 

// --- Position Name to Account Type Mapping ---
$position_to_account_type = [
    'POS-0006' => 'admin',
    'POS-0009' => 'housekeeping_manager',
    'POS-0008' => 'housekeeping_staff',
    'POS-0010' => 'maintenance_manager',
    'POS-0005' => 'maintenance_staff',
    'POS-0007' => 'inventory_manager',
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

        $pms_conn = get_db_connection('bt3wljbwprykeblz7tvq');
        if ($pms_conn === null) {
            send_json_response(false, 'Database connection error.');
        }

        // SAFE SYNC 1: Sync Names, Emails, and Contact Info
        $pms_conn->query("UPDATE pms_users p
            INNER JOIN employees e ON p.EmployeeID = e.employee_code
            LEFT JOIN employee_emails ee ON e.employee_id = ee.employee_id
            LEFT JOIN employee_contact_numbers ec ON e.employee_id = ec.employee_id
            LEFT JOIN employee_addresses ea ON e.employee_id = ea.employee_id
            SET 
                p.Fname = e.first_name, 
                p.Lname = e.last_name, 
                p.Mname = e.middle_name,
                p.EmailAddress = COALESCE(NULLIF(ee.email, ''), p.EmailAddress),
                p.ContactNumber = COALESCE(NULLIF(ec.contact_number, ''), p.ContactNumber),
                p.Address = COALESCE(NULLIF(ea.home_address, ''), p.Address)
            WHERE p.EmployeeID IS NOT NULL AND p.EmployeeID != ''");

        // SAFE SYNC 2: Sync Shift (Safely ignores bad time formats)
        $pms_conn->query("UPDATE pms_users p
            INNER JOIN employees e ON p.EmployeeID = e.employee_code
            SET p.Shift = CASE 
                WHEN e.scheduled_start_time IS NULL OR e.scheduled_start_time = '' THEN p.Shift
                WHEN HOUR(e.scheduled_start_time) >= 6 AND HOUR(e.scheduled_start_time) < 14 THEN 'Morning'
                WHEN HOUR(e.scheduled_start_time) >= 14 AND HOUR(e.scheduled_start_time) < 22 THEN 'Afternoon'
                ELSE 'Night'
            END
            WHERE p.EmployeeID IS NOT NULL AND p.EmployeeID != ''");

        // SAFE SYNC 3: Update Roles & Auto-Archive (Terminated OR Non-PMS Roles)
        $allowed_positions = array_keys($position_to_account_type);
        $escaped_positions = array_map(function($pos) use ($pms_conn) {
            return "'" . $pms_conn->real_escape_string($pos) . "'";
        }, $allowed_positions);
        $positions_str = implode(',', $escaped_positions);

        // Dynamically build the CASE statement for updating AccountType using position_code
        $case_statements = "";
        foreach ($position_to_account_type as $pos_code => $acc_type) {
            $pos_escaped = $pms_conn->real_escape_string($pos_code);
            $acc_escaped = $pms_conn->real_escape_string($acc_type);
            $case_statements .= " WHEN jp.position_code = '$pos_escaped' THEN '$acc_escaped' ";
        }

        $sync_roles_sql = "UPDATE pms_users p
            INNER JOIN employees e ON p.EmployeeID = e.employee_code
            LEFT JOIN job_positions jp ON e.position_id = jp.position_id
            SET 
                p.AccountType = CASE 
                    $case_statements
                    ELSE p.AccountType 
                END,
                p.is_archived = CASE 
                    WHEN e.status != 'active' THEN 1
                    WHEN jp.position_code NOT IN ($positions_str) THEN 1
                    ELSE p.is_archived 
                END";
        $pms_conn->query($sync_roles_sql);

        // --- FIX: ACTUALLY FETCH THE USERS AFTER SYNCING ---
        $sql = "SELECT p.UserID, p.EmployeeID, p.Fname, p.Lname, p.Mname, p.Birthday, p.AccountType, p.Username, p.EmailAddress, p.Shift, p.Address, p.ContactNumber, p.is_archived 
                FROM pms_users p
                INNER JOIN employees e ON p.EmployeeID = e.employee_code
                ORDER BY p.is_archived ASC, p.Lname ASC, p.Fname ASC"; 
        
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

        $pms_conn = get_db_connection('bt3wljbwprykeblz7tvq');
        
        // 1. Get search and limit params
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        $limit_param = isset($_GET['limit']) ? $_GET['limit'] : 20; 
        
        $allowed_positions = array_keys($position_to_account_type);
        $escaped_positions = array_map(function($pos) use ($pms_conn) {
            return "'" . $pms_conn->real_escape_string($pos) . "'";
        }, $allowed_positions);
        $positions_str = implode(',', $escaped_positions);

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
                    e.department_id = 2 AND 
                    jp.position_code IN ($positions_str) AND
                    u.UserID IS NULL";
                    
        if (!empty($search)) {
            $safe_search = $pms_conn->real_escape_string($search);
            $sql .= " AND (e.employee_code LIKE '%$safe_search%' OR e.first_name LIKE '%$safe_search%' OR e.last_name LIKE '%$safe_search%')";
        }

        $sql .= " ORDER BY e.last_name, e.first_name";

        // Apply the limit ONLY if it's not set to 'all'
        if ($limit_param !== 'all') {
            $limit = (int)$limit_param;
            if ($limit > 0) {
                $sql .= " LIMIT $limit";
            }
        }

        $result = $pms_conn->query($sql);
        
        if ($result) {
            $employees = $result->fetch_all(MYSQLI_ASSOC);
            send_json_response(true, 'Employees fetched.', $employees);
        } else {
            send_json_response(false, 'DB Error: ' . $pms_conn->error);
        }
        break;

  // --- 3. ADD MULTIPLE USERS ---
    case 'add_user_from_employee':
        if (!isset($_SESSION['UserID']) || $_SESSION['UserType'] !== 'admin') {
            send_json_response(false, 'Unauthorized access.');
        }
        
        // 1. Receive the comma-separated string from JS
        $raw_codes = $_POST['employeeCodes'] ?? '';
        
        // 2. Split it back into an array and clean up any empty spaces
        $employee_codes = array_filter(array_map('trim', explode(',', $raw_codes)));

        if (empty($employee_codes)) {
            send_json_response(false, 'No valid employees received by server.');
        }

        $pms_conn = get_db_connection('bt3wljbwprykeblz7tvq');
        
        $success_count = 0;
        $errors = [];

        // Loop through each selected employee
        foreach ($employee_codes as $employee_code) {

            // Double check existence
            $stmt_check = $pms_conn->prepare("SELECT UserID, is_archived FROM pms_users WHERE EmployeeID = ?");
            $stmt_check->bind_param("s", $employee_code);
            $stmt_check->execute();
            $res_check = $stmt_check->get_result();
            
            if ($res_check->num_rows > 0) {
                $row = $res_check->fetch_assoc();
                if ($row['is_archived'] == 1) {
                    $errors[] = "$employee_code is archived";
                } else {
                    $errors[] = "$employee_code is already registered";
                }
                $stmt_check->close();
                continue; 
            }
            $stmt_check->close();

            // Fetch Employee Data
            $sql_employee = "SELECT e.employee_code, e.first_name, e.last_name, e.middle_name, e.birthdate, e.scheduled_start_time,
                            ee.email, ec.contact_number, ea.home_address, jp.position_code, jp.position_name
                FROM employees e
                LEFT JOIN employee_emails ee ON e.employee_id = ee.employee_id
                LEFT JOIN employee_contact_numbers ec ON e.employee_id = ec.employee_id
                LEFT JOIN employee_addresses ea ON e.employee_id = ea.employee_id
                LEFT JOIN job_positions jp ON e.position_id = jp.position_id
                WHERE e.employee_code = ? AND e.department_id = 2 LIMIT 1";
            
            $stmt_emp = $pms_conn->prepare($sql_employee);
            
            // NEW: Safety check to catch silent SQL column errors
            if (!$stmt_emp) {
                $errors[] = "SQL Error for $employee_code: " . $pms_conn->error;
                continue;
            }

            $stmt_emp->bind_param("s", $employee_code);
            $stmt_emp->execute();
            $result_emp = $stmt_emp->get_result();
            
            if ($employee = $result_emp->fetch_assoc()) {
                $position_code = $employee['position_code'];
                if (!isset($position_to_account_type[$position_code])) {
                    $errors[] = "$employee_code has invalid position";
                    $stmt_emp->close();
                    continue;
                }
                
                $accountType = $position_to_account_type[$position_code];
                $username = strtolower($employee['last_name'] . '.' . $employee_code);
                
                // Validate Username Unique
                $stmt_check_user = $pms_conn->prepare("SELECT UserID FROM pms_users WHERE Username = ?");
                $stmt_check_user->bind_param("s", $username);
                $stmt_check_user->execute();
                if ($stmt_check_user->get_result()->num_rows > 0) {
                    $errors[] = "Username '$username' taken";
                    $stmt_check_user->close();
                    $stmt_emp->close();
                    continue;
                }
                $stmt_check_user->close();

                if (empty($employee['email'])) {
                    $errors[] = "$employee_code lacks an email address";
                    $stmt_emp->close();
                    continue;
                }

                $temp_password = password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);
                $token = bin2hex(random_bytes(32));
                $token_expiry = date('Y-m-d H:i:s', strtotime('+24 hours'));

                // Map the shift matching the JS logic!
                $safe_shift = 'Morning'; // Default
                if (!empty($employee['scheduled_start_time'])) {
                    $hour = (int)date('H', strtotime($employee['scheduled_start_time']));
                    if ($hour >= 6 && $hour < 14) {
                        $safe_shift = 'Morning';
                    } elseif ($hour >= 14 && $hour < 22) {
                        $safe_shift = 'Afternoon';
                    } else {
                        $safe_shift = 'Night';
                    }
                }

                $safe_address = !empty($employee['home_address']) ? $employee['home_address'] : 'Address Not Provided';
                $safe_birthday = !empty($employee['birthdate']) ? $employee['birthdate'] : '2000-01-01';
                $safe_contact = !empty($employee['contact_number']) ? $employee['contact_number'] : '00000000000';

               $sql_insert = "INSERT INTO pms_users 
                                (EmployeeID, Fname, Lname, Mname, Birthday, AccountType, Username, Password, 
                                 EmailAddress, Shift, Address, ContactNumber, ActivationToken, TokenExpiry, AvailabilityStatus, is_archived) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Offline', 0)";
                
                $stmt_insert = $pms_conn->prepare($sql_insert);
                $stmt_insert->bind_param("ssssssssssssss",
                    $employee_code, $employee['first_name'], $employee['last_name'], $employee['middle_name'], $safe_birthday,
                    $accountType, $username, $temp_password, $employee['email'], $safe_shift,
                    $safe_address, $safe_contact, $token, $token_expiry
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
                        $success_count++;
                    } catch (Throwable $e) {
                        $success_count++; // User was still inserted
                        $errors[] = "Email failed for $username";
                    }
                } else {
                    $errors[] = "Insert error for $employee_code";
                }
                $stmt_insert->close();
            } else {
                $errors[] = "$employee_code not found";
            }
            $stmt_emp->close();
        }

        // Final Response Status
        if ($success_count > 0) {
            $msg = "Successfully added $success_count user(s).";
            if (!empty($errors)) {
                $msg .= " (Issues: " . implode(", ", $errors) . ")";
            }
            send_json_response(true, $msg);
        } else {
            send_json_response(false, "Failed to add users. " . implode(" | ", $errors));
        }
        break;
        
    // --- 4. EDIT USER ---
    case 'edit_user':
        if (!isset($_SESSION['UserID']) || $_SESSION['UserType'] !== 'admin') {
            send_json_response(false, 'Unauthorized access.');
        }
        $pms_conn = get_db_connection('bt3wljbwprykeblz7tvq');
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
        
        $pms_conn = get_db_connection('bt3wljbwprykeblz7tvq');
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
        
        $pms_conn = get_db_connection('bt3wljbwprykeblz7tvq');
        $userID = filter_var($_POST['userID'] ?? null, FILTER_VALIDATE_INT);

        if ($userID === false) send_json_response(false, 'Invalid User ID.');

        // VERIFY: Check if the employee is "active" AND has a valid PMS position_code before restoring!
        $check_emp = $pms_conn->prepare("SELECT e.status, jp.position_code 
                                         FROM pms_users p 
                                         JOIN employees e ON p.EmployeeID = e.employee_code 
                                         LEFT JOIN job_positions jp ON e.position_id = jp.position_id 
                                         WHERE p.UserID = ?");
        $check_emp->bind_param("i", $userID);
        $check_emp->execute();
        $res_emp = $check_emp->get_result();
        
        if ($res_emp->num_rows > 0) {
            $emp_data = $res_emp->fetch_assoc();
            if ($emp_data['status'] !== 'active') {
                send_json_response(false, 'Cannot restore user. The employee is marked as terminated or inactive in the HR database.');
            }
            if (!array_key_exists($emp_data['position_code'], $position_to_account_type)) {
                send_json_response(false, 'Cannot restore user. The employee\'s current position does not grant PMS access.');
            }
        } else {
            send_json_response(false, 'Cannot restore user. The associated employee record no longer exists.');
        }
        $check_emp->close();

        // RESTORE: Proceed if employee is active
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
        $pms_conn = get_db_connection('bt3wljbwprykeblz7tvq');
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