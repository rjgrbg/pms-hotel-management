<?php
/**
 * db_connection.php
 * Manages all database connections for the application.
 */

// Start Session - This MUST be the very first thing called.
if (session_status() == PHP_SESSION_NONE) {
    session_start([
        'cookie_httponly' => true,
        'cookie_secure' => isset($_SERVER['HTTPS']),
        'use_strict_mode' => true
    ]);
}

// --- Application Constants ---
// --- THIS IS THE FIX ---
// The URL must match your server, including the port.
define('BASE_URL', 'http://localhost:3000/'); 
// --- END OF FIX ---

/**
 * A static array to hold all our active database connections.
 * This prevents reconnecting to the same database multiple times.
 */
static $connections = [];

/**
 * Gets a specific database connection.
 *
 * @param string $db_name The key for the database you want (e.g., 'pms' or 'hris')
 * @return mysqli|null The MySQLi connection object or null on failure.
 */
function get_db_connection($db_name = 'pms') {
    global $connections; // Use the static array

    // 1. If we already have this connection, return it.
    if (isset($connections[$db_name])) {
        // Check if connection is still alive
        if ($connections[$db_name] instanceof mysqli && $connections[$db_name]->ping()) {
            return $connections[$db_name];
        }
        // Connection died, remove it
        unset($connections[$db_name]);
    }

    // 2. Define the credentials for all your databases
    // *** UPDATE THESE DETAILS AS NEEDED ***
    $db_credentials = [
        'pms' => [
            'host' => 'localhost',
            'user' => 'root',
            'password' => '',
            'database' => 'pms' // Your main application database
        ],
        'hris' => [
            'host' => 'localhost', // Assuming same server, update if different
            'user' => 'root',
            'password' => '',
            'database' => 'hris' // The new HRIS database
        ],
        // --- NEWLY ADDED ---
        'crm' => [
            'host' => 'localhost', // Assuming same server, update if different
            'user' => 'root',
            'password' => '',
            'database' => 'crm' // The new CRM database
        ]
        // --- END NEW ---
    ];

    // 3. Check if the requested database exists in our config
    if (!isset($db_credentials[$db_name])) {
        error_log("Database configuration '$db_name' not found.");
        return null;
    }

    $creds = $db_credentials[$db_name];

    // 4. Create the new connection
    // Enable error reporting for mysqli
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    try {
        $conn = new mysqli($creds['host'], $creds['user'], $creds['password'], $creds['database']);
        $conn->set_charset("utf8mb4");
    } catch (Exception $e) {
        error_log("ERROR: Could not connect to database '$db_name'. " . $e->getMessage());
        return null; // Return null on failure
    }
    // Disable strict error reporting after connection
    mysqli_report(MYSQLI_REPORT_OFF);


    // 5. Store the new connection in our static array and return it
    $connections[$db_name] = $conn;
    return $conn;
}

/**
 * Closes all active database connections.
 * (This function is no longer called automatically, 
 * but can be kept for manual use if needed)
 */
function close_all_connections() {
    global $connections;
    foreach ($connections as $db_name => $conn) {
        if ($conn instanceof mysqli) {
            $conn->close();
        }
    }
    $connections = [];
}

// --- REMOVED THE CONFLICTING SHUTDOWN FUNCTION ---
// register_shutdown_function('close_all_connections'); // <-- This line was removed.

// --- Create a default $conn variable for 'pms' for legacy files ---
$conn = get_db_connection('pms');

?>