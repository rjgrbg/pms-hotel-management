<?php
// user_actions.php
header('Content-Type: application/json');

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
    if (!isset($_SESSION['UserID']) || !isset($_SESSION['UserType']) || $_SESSION['UserType'] !== 'admin') {
        send_json_response(false, 'Unauthorized: Admin privileges required.');
    }
}

// Check DB connection after including db_connection.php
if (!isset($conn) || !($conn instanceof mysqli) || $conn->connect_error) {
    error_log("Database connection failed in user_actions.php: " . ($conn->connect_error ?? 'Connection object not initialized'));
    send_json_response(false, 'Database connection error. Please try again later.');
}


$action = $_POST['action'] ?? $_GET['action'] ?? null;

if (!$action) {
    send_json_response(false, 'No action specified.');
}

switch ($action) {
    case 'fetch_users':
        // Check if user is logged in (session started by check_session.php)
        if (!isset($_SESSION['UserID'])) {
             send_json_response(false, 'Unauthorized: Login required.');
        }
        // Optional: Add admin check for consistency, though admin.php checks page access
        if (!isset($_SESSION['UserType']) || $_SESSION['UserType'] !== 'admin') {
            send_json_response(false, 'Unauthorized: Admin privileges required for fetching users.');
        }

        $sql = "SELECT UserID, Fname, Lname, Mname, Birthday, AccountType, Username, EmailAddress, Shift, Address FROM users ORDER BY Lname, Fname";

        // **Improved Error Handling**
        $result = $conn->query($sql); // Execute the query

        // Check if the query execution itself failed
        if ($result === false) {
             error_log("Database error fetching users: " . $conn->error); // Log detailed error server-side
             send_json_response(false, 'Database error fetching users. Please check server logs.'); // More generic message client-side
        } else {
             // Check if the result is a valid result object before fetching
             if ($result instanceof mysqli_result) {
                 $users = $result->fetch_all(MYSQLI_ASSOC);
                 $result->free(); // Free the result set memory
                 send_json_response(true, 'Users fetched successfully.', $users);
             } else {
                 // This case indicates an unexpected issue if $result wasn't false
                 error_log("Unexpected non-result object from user fetch query.");
                 send_json_response(false, 'Unexpected error fetching user data.');
             }
        }
        // ** Ensure break is present if needed, but send_json_response exits **
        break; // Added break for clarity and safety

    case 'add_user':
        require_admin_privilege(); // Keep admin check for modification actions

        // ... (rest of add_user logic - ensure it uses send_json_response on error/success) ...
        // [Existing add_user code from your file goes here]
        // Make sure all exit points use send_json_response()
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

        // ... (rest of edit_user logic - ensure it uses send_json_response) ...
        // [Existing edit_user code from your file goes here]
        // Make sure all exit points use send_json_response()
         $required_fields = ['userID', 'username', 'fname', 'lname', 'birthday', 'accountType', 'email', 'shift', 'address'];
        foreach ($required_fields as $field) {
            // Skip password validation here if it's optional on edit
            if (($field === 'password' || $field === 'confirmPassword')) continue;
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
        $password = $_POST['password'] ?? null;
        $confirmPassword = $_POST['confirmPassword'] ?? null;

        if ($userID === false) {
             send_json_response(false, 'Invalid User ID.');
        }
         if (!$email) {
            send_json_response(false, 'Invalid email format.');
        }

        // Check for duplicate username/email EXCEPT for the current user
        $check_sql = "SELECT UserID FROM users WHERE (Username = ? OR EmailAddress = ?) AND UserID != ?";
        $stmt_check = $conn->prepare($check_sql);
         if (!$stmt_check) {
             error_log("DB Prepare Error (Check User Exists Edit): " . $conn->error);
             send_json_response(false, 'Database error preparing check.');
        }
        $stmt_check->bind_param("ssi", $username, $email, $userID);
        $stmt_check->execute();
        $stmt_check->store_result();
        if ($stmt_check->num_rows > 0) {
            $stmt_check->close();
            send_json_response(false, 'Username or Email already exists for another user.');
        }
        $stmt_check->close();

        // Build the update query dynamically
        $update_fields = [
            'Username' => $username,
            'Fname' => $fname,
            'Lname' => $lname,
            'Mname' => $mname,
            'Birthday' => $birthday,
            'AccountType' => $accountType,
            'EmailAddress' => $email,
            'Shift' => $shift,
            'Address' => $address
        ];
        $types = "sssssssss"; // 9 strings initially
        $params = array_values($update_fields); // Use array_values to ensure numeric keys

        $update_sql_parts = [];
        foreach (array_keys($update_fields) as $key) {
            $update_sql_parts[] = "`$key` = ?";
        }

        // Only add password to update if provided
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

        // Add the UserID for the WHERE clause
        $types .= "i"; // Add integer type for UserID
        $params[] = $userID;

        $update_sql = "UPDATE users SET " . implode(', ', $update_sql_parts) . " WHERE UserID = ?";

        $stmt_update = $conn->prepare($update_sql);
         if (!$stmt_update) {
             error_log("DB Prepare Error (Update User): " . $conn->error . " SQL: " . $update_sql);
             send_json_response(false, 'Database error preparing update.');
        }

        // Dynamically bind parameters using references
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
                 // Check if there was actually an error or just no change
                 if ($stmt_update->errno) {
                     error_log("DB Execute Error (Update User): " . $stmt_update->error);
                     send_json_response(false, 'Failed to update user.');
                 } else {
                     send_json_response(true, 'No changes detected for the user.'); // Not an error
                 }
             }
        } else {
            error_log("DB Execute Error (Update User): " . $stmt_update->error);
            send_json_response(false, 'Failed to update user.');
        }
        $stmt_update->close();
        break;


    case 'delete_user':
        require_admin_privilege(); // Keep admin check

        // ... (rest of delete_user logic - ensure it uses send_json_response) ...
        // [Existing delete_user code from your file goes here]
        // Make sure all exit points use send_json_response()
        $userID = filter_var($_POST['userID'] ?? null, FILTER_VALIDATE_INT);

        if ($userID === false) {
            send_json_response(false, 'Invalid User ID provided.');
        }

         // Prevent self-deletion
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
                 send_json_response(false, 'User not found or already deleted.'); // More informative
             }
        } else {
             // Check for foreign key constraint error (MySQL error code 1451)
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