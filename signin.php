<?php
// Set headers to prevent caching and ensure JSON/text response on error
header('Content-Type: text/plain'); 
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT'); // Date in the past

// Start session immediately, as it's needed for successful login
session_start();

include('db_connection.php');

// --- 1. Centralize Redirection Links ---
$redirect_map = [
    'admin'           => 'admin.php',
    'housekeeping_head' => 'housekeeping.html',
    'maintenance_head'  => 'maintenance.html',
    'default'         => 'index.html'
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Use trim() to clean up whitespace from user input
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    // NEW: Check if the 'remember_me' checkbox was checked
    $remember_me = isset($_POST['remember_me']) && $_POST['remember_me'] === 'on';

    // --- 2. Use exit() instead of die() ---
    if (empty($username) || empty($password)) {
        echo "Both username and password are required.";
        $conn->close();
        exit(); 
    }

    $sql = "SELECT user_id, password, user_type FROM users WHERE username = ?";
    
    // Check for successful preparation
    if (!$stmt = $conn->prepare($sql)) {
        echo "Database error: Could not prepare statement.";
        $conn->close();
        exit();
    }
    
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $stmt->store_result();


    if ($stmt->num_rows > 0) {
        $stmt->bind_result($id, $hashed_password, $user_type);
        $stmt->fetch();

        if (password_verify($password, $hashed_password)) {
            // SUCCESSFUL LOGIN
            
            $_SESSION['user_id'] = $id;
            $_SESSION['username'] = $username;
            $_SESSION['user_type'] = $user_type;

            // ⭐️ NEW: Handle Remember Me Feature ⭐️
            if ($remember_me) {
                // Generate a cryptographically secure token
                $token = bin2hex(random_bytes(32)); 
                $expire_time = time() + (86400 * 30); // Expires in 30 days

                // --- SECURITY CRITICAL STEP: Store the token in the database ---
                // In a real application, you MUST update a 'remember_token' column 
                // in your 'users' table here to tie the token to the user ID.
                /*
                $update_sql = "UPDATE users SET remember_token = ? WHERE user_id = ?";
                $update_stmt = $conn->prepare($update_sql);
                $update_stmt->bind_param("si", $token, $id);
                $update_stmt->execute();
                $update_stmt->close();
                */
                
                // Set the secure, HTTP-only cookie
                setcookie(
                    'remember_me_token', // Cookie name
                    $token,             // Cookie value (the secure token)
                    [
                        'expires' => $expire_time,
                        'path' => '/',              
                        'secure' => true,           // Recommended: Only send over HTTPS
                        'httponly' => true,         // ESSENTIAL: Prevents JavaScript access
                        'samesite' => 'Lax',
                    ]
                );
            }
            // ⭐️ END Remember Me Handling ⭐️

            // --- 3. Use 302 Redirect Header for successful login ---
            $location = $redirect_map[$user_type] ?? $redirect_map['default'];

            header("Location: $location", true, 302);
            exit(); 
        } else {
            // INCORRECT PASSWORD
            echo "Incorrect username or password."; 
        }
    } else {
        // NO USER FOUND
        echo "Incorrect username or password."; 
    }

    $stmt->close();
} else {
    // INVALID REQUEST METHOD
    echo "Invalid request method.";
}

$conn->close();
?>