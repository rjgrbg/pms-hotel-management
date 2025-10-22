<?php
/**
 * db_connection.php
 * Establishes the MySQLi database connection and initializes the session.
 */

// Start Session - This MUST be the very first thing called.
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Database Credentials
$host = "localhost";
$user = "root";
$password = "";
$database = "pms"; 

// --- Application Constants (for use in other files) ---
define('BASE_URL', 'http://localhost/pms-hotel-management/'); 

// Establish MySQLi Connection
$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    error_log("ERROR: Could not connect. " . $conn->connect_error);
    // Sends a 500 Server Error response code
    http_response_code(500);
    // Halts script execution and displays the error message
    die("Database connection failed: " . $conn->connect_error);
}

// NOTE: The connection object is now available as $conn globally to any file that includes this one.
?>