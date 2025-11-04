<?php
// user_actions.php

// 'use' statements MUST be at the very top
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Set header AFTER 'use' statements
header('Content-Type: application/json');

// --- REQUIRED FOR EMAIL ---
// Load Composer's autoloader
require 'vendor/autoload.php';
// Include your email configuration
include('email_config.php');
// --- END OF EMAIL REQUIREMENTS ---

// Includes - Ensure these paths are correct
include('db_connection.php');


// Ensure errors are logged, not displayed, to avoid breaking JSON
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors directly to the browser
ini_set('log_errors', 1); // Log errors to the server's error log
// ini_set('error_log', '/path/to/your/php-error.log'); // Optional: Specify a custom log file path

function send_json_response($success, $message, $data = null) {
    $response = ['success' => $success, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    // Ensure connection is closed before sending response if it exists
    global $conn;
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
    echo json_encode($response);
    exit;
}

function require_admin_privilege() {
    // Check if session was started
    if (session_status() == PHP_SESSION_NONE) {
        session_start([
            'cookie_httponly' => true,
            'cookie_secure' => isset($_SERVER['HTTPS']),
            'use_strict_mode' => true
        ]);
    }
    
    if (!isset($_SESSION['UserID']) || !isset($_SESSION['UserType']) || $_SESSION['UserType'] !== 'admin') {
        // Send 401 Unauthorized, which might be caught by .catch()
        http_response_code(401); 
        send_json_response(false, 'Unauthorized: Admin privileges required.');
    }
}

// Check DB connection after including db_connection.php
if (!isset($conn) || !($conn instanceof mysqli) || $conn->connect_error) {
    error_log("Database connection failed in user_actions.php: " . ($conn->connect_error ?? 'Connection object not initialized'));
    http_response_code(500);
    send_json_response(false, 'Database connection error. Please try again later.');
}


$action = $_POST['action'] ?? $_GET['action'] ?? null;

if (!$action) {
    send_json_response(false, 'No action specified.');
}

switch ($action) {
    case 'fetch_users':
        // Check if user is logged in (session started by db_connection.php)
        if (!isset($_SESSION['UserID'])) {
             send_json_response(false, 'Unauthorized: Login required.');
        }
        // Optional: Add admin check for consistency, though admin.php checks page access
        if (!isset($_SESSION['UserType']) || $_SESSION['UserType'] !== 'admin') {
            send_json_response(false, 'Unauthorized: Admin privileges required for fetching users.');
        }

        // Added EmployeeID
        $sql = "SELECT UserID, EmployeeID, Fname, Lname, Mname, Birthday, AccountType, Username, EmailAddress, Shift, Address FROM users ORDER BY Lname, Fname";

        $result = $conn->query($sql); 

        if ($result === false) {
             error_log("Database error fetching users: " . $conn->error); 
             send_json_response(false, 'Database error fetching users. Please check server logs.'); 
        } else {
             if ($result instanceof mysqli_result) {
                 $users = $result->fetch_all(MYSQLI_ASSOC);
                 $result->free(); 
                 send_json_response(true, 'Users fetched successfully.', $users);
             } else {
                 error_log("Unexpected non-result object from user fetch query.");
                 send_json_response(false, 'Unexpected error fetching user data.');
             }
        }
        break; 

    // --- MODIFIED BLOCK FOR ADDING USER FROM HRIS ---
    case 'add_employee_by_id':
        require_admin_privilege();
        
        $employeeId = $_POST['employeeId'] ?? null;
        if (empty($employeeId)) {
            send_json_response(false, 'Employee ID is required.');
        }

        // Get both DB connections from your db_connection.php
        $hris_conn = get_db_connection('hris');
        $pms_conn = $conn; // $conn is 'pms' by default

        if (!$hris_conn) {
            error_log("Failed to connect to HRIS database.");
            send_json_response(false, 'Could not connect to HRIS database.');
        }
        if (!$pms_conn) {
             error_log("Failed to connect to PMS database.");
            send_json_response(false, 'Could not connect to PMS database.');
        }

        // 1. Fetch employee from HRIS database
        $hris_sql = "SELECT EmployeeID, Fname, Lname, Mname, Birthday, EmailAddress, Address, ContactNumber, Position FROM employees WHERE EmployeeID = ?";
        $stmt_hris = $hris_conn->prepare($hris_sql);
        if (!$stmt_hris) {
             error_log("HRIS DB Prepare Error: " . $hris_conn->error);
             send_json_response(false, 'HRIS database error (prepare).');
        }
        
        $stmt_hris->bind_param("s", $employeeId);
        $stmt_hris->execute();
        $hris_result = $stmt_hris->get_result();
        
        if ($hris_result->num_rows === 0) {
            $stmt_hris->close();
            $hris_conn->close(); // <-- Close HRIS connection
            send_json_response(false, "Employee ID '$employeeId' not found in HRIS database.");
        }
        
        $employee = $hris_result->fetch_assoc();
        $stmt_hris->close();
        
        // 2. Check if user already exists in PMS (by Email or EmployeeID)
        $pms_check_sql = "SELECT UserID FROM users WHERE EmailAddress = ? OR EmployeeID = ?";
        $stmt_pms_check = $pms_conn->prepare($pms_check_sql);
        if (!$stmt_pms_check) {
             error_log("PMS DB Prepare Error (Check): " . $pms_conn->error);
             $hris_conn->close(); // <-- Close HRIS connection
             send_json_response(false, 'PMS database error (check).');
        }
        $stmt_pms_check->bind_param("ss", $employee['EmailAddress'], $employee['EmployeeID']);
        $stmt_pms_check->execute();
        $stmt_pms_check->store_result();
        
        if ($stmt_pms_check->num_rows > 0) {
            $stmt_pms_check->close();
            $hris_conn->close(); // <-- Close HRIS connection
            send_json_response(false, 'This employee (Email or ID) already exists in the PMS system.');
        }
        $stmt_pms_check->close();
        
        // We are done with the HRIS database, so we can close it.
        $hris_conn->close(); // <-- Close HRIS connection

        // 3. Map HRIS data to PMS data
        $employee_id_to_insert = $employee['EmployeeID'];
        $fname = $employee['Fname'];
        $lname = $employee['Lname'];
        $mname = $employee['Mname'];
        $birthday = $employee['Birthday'];
        $email = $employee['EmailAddress'];
        $address = $employee['Address'];
        
        // --- Create logic for new PMS fields ---
        
        // --- THIS IS THE FIX ---
        // A. Create a username (lastname + employeeid)
        // e.g., "Smith" + "E1004" = "smithe1004"
        $username_base = strtolower($employee['Lname'] . $employee['EmployeeID']);
        $username = preg_replace('/[^a-z0-9]/', '', $username_base); // Sanitize to letters/numbers only
        // --- END OF FIX ---
        
        // B. Map HRIS Position to PMS AccountType
        $accountType = 'housekeeping_staff'; // Default
        $hris_position = strtolower($employee['Position']);
        
        $position_map = [
            'admin' => 'admin',
            'housekeeping manager' => 'housekeeping_manager',
            'housekeeper' => 'housekeeping_staff',
            'maintenance manager' => 'maintenance_manager',
            'senior maintenance' => 'maintenance_staff',
            'maintenance' => 'maintenance_staff',
            'parking attendant' => 'parking_manager' 
        ];
        
        if (array_key_exists($hris_position, $position_map)) {
            $accountType = $position_map[$hris_position];
        }

        // C. Set default shift
        $shift = ''; // You can change this default

        // D. --- NEW: Generate Token instead of Password ---
        $token = bin2hex(random_bytes(32)); // 64-char hex token
        $token_expiry = date('Y-m-d H:i:s', strtotime('+24 hours')); // Token valid for 24 hours

        // 4. Insert the new user into pms.users table
        $pms_insert_sql = "INSERT INTO users (EmployeeID, Fname, Lname, Mname, Birthday, AccountType, Username, Password, EmailAddress, Shift, Address, ActivationToken, TokenExpiry)
                           VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?)";
        
        $stmt_pms_insert = $pms_conn->prepare($pms_insert_sql);
        if (!$stmt_pms_insert) {
             error_log("PMS DB Prepare Error (Insert): " . $pms_conn->error);
             send_json_response(false, 'PMS database error (insert).');
        }
        
        // Bind 12 parameters (11 strings, 1 null password)
        $stmt_pms_insert->bind_param("ssssssssssss",
            $employee_id_to_insert, 
            $fname, $lname, $mname, $birthday, $accountType,
            $username, $email, $shift, $address,
            $token, $token_expiry // Add token and expiry
        );

        if ($stmt_pms_insert->execute()) {
            // --- 5. SEND ACTIVATION EMAIL ---
            $mail = new PHPMailer(true);
            $activation_link = BASE_URL . "activate.php?token=" . $token; // Use BASE_URL from db_connection.php

            try {
                // Server settings
                $mail->isSMTP();
                $mail->Host       = 'smtp.gmail.com';
                $mail->SMTPAuth   = true;
                $mail->Username   = GMAIL_EMAIL;
                $mail->Password   = GMAIL_APP_PASSWORD;
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
                $mail->Port       = 465;

                // Recipients
                $mail->setFrom(GMAIL_EMAIL, EMAIL_FROM_NAME);
                $mail->addAddress($email, "$fname $lname"); // Send to the new user

                // Content
                $mail->isHTML(true);
                $mail->Subject = 'Activate Your Celestia Hotel PMS Account';
                $mail->Body    = "Dear $fname,<br><br>An account has been created for you in the Celestia Hotel Property Management System.<br><br>Your username is: <b>$username</b><br><br>Please click the link below to activate your account and set your password. This link is valid for 24 hours.<br><br><a href='$activation_link'>$activation_link</a><br><br>Sincerely,<br>The Celestia Hotel Team";
                $mail->AltBody = "Welcome, $fname. Your username is $username. Please visit this link to activate your account and set your password: $activation_link";

                $mail->send();
                send_json_response(true, "Success! User '$username' created. An activation email has been sent to $email.");

            } catch (Throwable $e) { // Catch all fatal errors
                $detailed_error = "Email Error: " . $e->getMessage();
                error_log("PHPMailer Fatal Error for $username: " . $detailed_error); // Log it
                send_json_response(false, $detailed_error); // Send it
            }
            // --- END OF EMAIL ---
            
        } else {
             error_log("PMS DB Execute Error (Insert): " . $stmt_pms_insert->error);
             if ($pms_conn->errno == 1062) { 
                 send_json_response(false, "Employee found, but the generated username '$username' or EmployeeID '$employee_id_to_insert' already exists.");
             } else {
                 send_json_response(false, 'Failed to insert user into PMS.');
             }
        }
        $stmt_pms_insert->close();
        break;
    // --- END OF MODIFIED BLOCK ---

    case 'add_user':
        require_admin_privilege(); 

         // CORRECTED: Removed 'contact'
         $required_fields = ['username', 'fname', 'lname', 'birthday', 'accountType', 'email', 'shift', 'address', 'password', 'confirmPassword'];
        foreach ($required_fields as $field) {
            if (empty($_POST[$field])) {
                send_json_response(false, "Missing required field: " . ucfirst($field));
            }
        }

        $username = trim($_POST['username']);
        $fname = trim($_POST['fname']);
        $lname = trim($_POST['lname']);
        $mname = !empty($_POST['mname']) ? trim($_POST['mname']) : null;
        $birthday = $_POST['birthday'];
        $accountType = $_POST['accountType'];
        $email = filter_var(trim($_POST['email']), FILTER_VALIDATE_EMAIL);
        $shift = $_POST['shift'];
        $address = trim($_POST['address']);
        $password = $_POST['password'];
        $confirmPassword = $_POST['confirmPassword'];

        if (!$email) {
            send_json_response(false, 'Invalid email format.');
        }
        if (strlen($password) < 6) {
             send_json_response(false, 'Password must be at least 6 characters long.');
        }
        if ($password !== $confirmPassword) {
            send_json_response(false, 'Passwords do not match.');
        }

        $check_sql = "SELECT UserID FROM users WHERE Username = ? OR EmailAddress = ?";
        $stmt_check = $conn->prepare($check_sql);
        if (!$stmt_check) {
             error_log("DB Prepare Error (Check User Exists): " . $conn->error);
             send_json_response(false, 'Database error preparing check.');
        }
        $stmt_check->bind_param("ss", $username, $email);
        $stmt_check->execute();
        $stmt_check->store_result();
        if ($stmt_check->num_rows > 0) {
            $stmt_check->close();
            send_json_response(false, 'Username or Email already exists.');
        }
        $stmt_check->close();

        $hashed_password = password_hash($password, PASSWORD_DEFAULT);

        $insert_sql = "INSERT INTO users (Username, Fname, Lname, Mname, Birthday, AccountType, EmailAddress, Shift, Address, Password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt_insert = $conn->prepare($insert_sql);
        if (!$stmt_insert) {
             error_log("DB Prepare Error (Insert User): " . $conn->error);
             send_json_response(false, 'Database error preparing insert.');
        }
        $stmt_insert->bind_param("ssssssssss", $username, $fname, $lname, $mname, $birthday, $accountType, $email, $shift, $address, $hashed_password);

        if ($stmt_insert->execute()) {
            send_json_response(true, 'User added successfully.');
        } else {
             error_log("DB Execute Error (Insert User): " . $stmt_insert->error);
            send_json_response(false, 'Failed to add user.');
        }
        $stmt_insert->close();
        break;


    case 'edit_user':
        require_admin_privilege(); // Keep admin check

        $required_fields = ['userID', 'username', 'fname', 'lname', 'birthday', 'accountType', 'email', 'shift', 'address'];
        foreach ($required_fields as $field) {
            if (($field === 'password' || $field === 'confirmPassword')) continue;
            if ($field === 'employeeID' && empty($_POST[$field])) continue; 
            if (empty($_POST[$field])) {
                send_json_response(false, "Missing required field: " . ucfirst($field));
            }
        }

        $userID = filter_var($_POST['userID'], FILTER_VALIDATE_INT);
        $username = trim($_POST['username']);
        $fname = trim($_POST['fname']);
        $lname = trim($_POST['lname']);
        $mname = !empty($_POST['mname']) ? trim($_POST['mname']) : null;
        $birthday = $_POST['birthday'];
        $accountType = $_POST['accountType'];
        $email = filter_var(trim($_POST['email']), FILTER_VALIDATE_EMAIL);
        $shift = $_POST['shift'];
        $address = trim($_POST['address']);
        
        $employee_id = !empty($_POST['employeeID']) ? trim($_POST['employeeID']) : null; 
        
        $password = $_POST['password'] ?? null;
        $confirmPassword = $_POST['confirmPassword'] ?? null;

        if ($userID === false) {
             send_json_response(false, 'Invalid User ID.');
        }
         if (!$email) {
            send_json_response(false, 'Invalid email format.');
        }

        $check_sql = "SELECT UserID FROM users WHERE (Username = ? OR EmailAddress = ? OR (EmployeeID = ? AND EmployeeID IS NOT NULL)) AND UserID != ?";
        $stmt_check = $conn->prepare($check_sql);
         if (!$stmt_check) {
             error_log("DB Prepare Error (Check User Exists Edit): " . $conn->error);
             send_json_response(false, 'Database error preparing check.');
        }
        $stmt_check->bind_param("sssi", $username, $email, $employee_id, $userID);
        $stmt_check->execute();
        $stmt_check->store_result();
        if ($stmt_check->num_rows > 0) {
            $stmt_check->close();
            send_json_response(false, 'Username, Email, or EmployeeID already exists for another user.');
        }
        $stmt_check->close();

        $update_fields = [
            'Username' => $username,
            'Fname' => $fname,
            'Lname' => $lname,
            'Mname' => $mname,
            'Birthday' => $birthday,
            'AccountType' => $accountType,
            'EmailAddress' => $email,
            'Shift' => $shift,
            'Address' => $address,
            'EmployeeID' => $employee_id
        ];
        $types = "ssssssssss"; // 10 strings initially
        $params = array_values($update_fields); 

        $update_sql_parts = [];
        foreach (array_keys($update_fields) as $key) {
            $update_sql_parts[] = "`$key` = ?";
        }

        if (!empty($password)) {
             if (strlen($password) < 6) {
                 send_json_response(false, 'Password must be at least 6 characters long.');
             }
            if ($password !== $confirmPassword) {
                send_json_response(false, 'Passwords do not match.');
            }
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            $update_sql_parts[] = "`Password` = ?";
            $types .= "s"; // Add string type for password
            $params[] = $hashed_password;
        }

        $types .= "i"; // Add integer type for UserID
        $params[] = $userID;

        $update_sql = "UPDATE users SET " . implode(', ', $update_sql_parts) . " WHERE UserID = ?";

        $stmt_update = $conn->prepare($update_sql);
         if (!$stmt_update) {
             error_log("DB Prepare Error (Update User): " . $conn->error . " SQL: " . $update_sql);
             send_json_response(false, 'Database error preparing update.');
        }

        $bind_params = [];
        $bind_params[] = $types;
        foreach ($params as $key => $value) {
            $bind_params[] = &$params[$key]; // Pass by reference
        }
        call_user_func_array([$stmt_update, 'bind_param'], $bind_params);


        if ($stmt_update->execute()) {
             if ($stmt_update->affected_rows > 0) {
                 send_json_response(true, 'User updated successfully.');
             } else {
                 if ($stmt_update->errno) {
                     error_log("DB Execute Error (Update User): " . $stmt_update->error);
                     send_json_response(false, 'Failed to update user.');
                 } else {
                     send_json_response(true, 'No changes detected for the user.');
                 }
             }
        } else {
            error_log("DB Execute Error (Update User): " . $stmt_update->error);
            send_json_response(false, 'Failed to update user.');
        }
        $stmt_update->close();
        break;


    case 'delete_user':
        require_admin_privilege(); 

        $userID = filter_var($_POST['userID'] ?? null, FILTER_VALIDATE_INT);

        if ($userID === false) {
            send_json_response(false, 'Invalid User ID provided.');
        }

         if (isset($_SESSION['UserID']) && $userID === (int)$_SESSION['UserID']) {
             send_json_response(false, 'Cannot delete your own account.');
         }

        $delete_sql = "DELETE FROM users WHERE UserID = ?";
        $stmt_delete = $conn->prepare($delete_sql);
         if (!$stmt_delete) {
              error_log("DB Prepare Error (Delete User): " . $conn->error);
             send_json_response(false, 'Database error preparing delete.');
        }
        $stmt_delete->bind_param("i", $userID);

        if ($stmt_delete->execute()) {
             if ($stmt_delete->affected_rows > 0) {
                 send_json_response(true, 'User deleted successfully.');
             } else {
                 send_json_response(false, 'User not found or already deleted.');
             }
        } else {
             if ($stmt_delete->errno == 1451) {
                 send_json_response(false, 'Cannot delete user: User is referenced in other records (e.g., logs, tasks). Please reassign or remove related records first.');
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

// Function to pass array values by reference needed for call_user_func_array with bind_param
function array_ref_values($arr){
    if (strnatcmp(phpversion(),'5.3') >= 0) { //Reference is required for PHP 5.3+
        $refs = array();
        foreach($arr as $key => $value)
            $refs[$key] = &$arr[$key];
        return $refs;
    }
    return $arr;
}
?>