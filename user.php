<?php
/**
 * User.php
 * Function to fetch user data from the database, using keys expected by the front-end.
 */

/**
 * Retrieves user data from the database based on the session ID.
 * @param mysqli $conn The active MySQLi connection object.
 * @return array Contains 'Name' (combined full name) and 'Accounttype' (user type/role).
 */
function getUserData($conn) {
    // 1. Check if the user is logged in
    // FIX: Using 'UserID' (from login script) for security check
    if (!isset($_SESSION['UserID']) || $_SESSION['UserID'] <= 0) { 
        // FIX: Using 'Name' as the return key, matching the array below
        return ['Name' => 'Guest', 'Accounttype' => 'N/A'];
    }

    // FIX: Using 'UserID' to retrieve the ID from the session
    $userId = $_SESSION['UserID'];
    
    try {
        // SQL query matches your provided structure: fname, mname, lname, and AccountType.
        // It also matches your column names: 'users' table, 'userid' column.
        $sql = "SELECT fname, mname, lname, AccountType FROM users WHERE UserID = ?";
        $stmt = $conn->prepare($sql);
        
        if (!$stmt) {
            throw new Exception("SQL statement preparation failed: " . $conn->error);
        }
        
        $stmt->bind_param("i", $userId); 
        $stmt->execute();
        
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();

        if ($user) {
            // Construct full name (Last Name, First Name Middle Initial is common for staff)
            // You can adjust the order here: e.g., $user['lname'] . ', ' . $user['fname'] ...
            $fullName = trim(
                $user['fname'] . 
                // Adds middle initial only if mname is not empty
                (empty($user['mname']) ? '' : ' ' . substr($user['mname'], 0, 1) . '.') . 
                ' ' . 
                $user['lname']
            );

            // Return the fetched data with the array keys your main file expects ('Name' and 'Accounttype')
            return [
                'Name'        => $fullName, 
                'Accounttype' => $user['AccountType']
            ];
        }

    } catch (Exception $e) {
        error_log("User data retrieval error: " . $e->getMessage());
        return ['Name' => 'DB Error', 'Accounttype' => 'DB_FAIL'];
    }

    // Fallback if the query ran but no user was found (e.g., ID exists but is not in the users table)
    return ['Name' => 'User Not Found', 'Accounttype' => 'INVALID'];
}
?>