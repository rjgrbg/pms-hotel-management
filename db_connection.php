<?php
/**
 * db_connection.php
 */

// Start Session
if (session_status() == PHP_SESSION_NONE) {
    // Check for HTTPS or Forwarded Proto (for Clever Cloud load balancers)
    $isSecure = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || 
                (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

    session_start([
        'cookie_httponly' => true,
        'cookie_secure' => $isSecure, 
        'use_strict_mode' => true
    ]);
}

// --- Application Constants ---
$protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? "https://" : "http://";
$domain = $_SERVER['HTTP_HOST'] ?? 'localhost:3000';
$baseUrl = getenv('APP_URL') ?: $protocol . $domain . '/';

define('BASE_URL', $baseUrl); 

static $db_connection = null;

function get_db_connection($db_name = 'b9wkqgu32onfqy0dvyva') {
    global $db_connection;

    if ($db_connection instanceof mysqli && $db_connection->ping()) {
        return $db_connection;
    }

    // --- CLEVER CLOUD CONFIGURATION ---
    // FIX: Using '?:' ensures your hardcoded credentials work on Localhost
    $db_host = getenv('MYSQL_ADDON_HOST') ?: 'b9wkqgu32onfqy0dvyva-mysql.services.clever-cloud.com';
    $db_user = getenv('MYSQL_ADDON_USER') ?: 'us5iydjghtqpmreu';
    $db_pass = getenv('MYSQL_ADDON_PASSWORD') ?: 'PL390M5lVFBYK7SZzeR';
    $db_name_config = getenv('MYSQL_ADDON_DB') ?: 'b9wkqgu32onfqy0dvyva';
    $db_port = getenv('MYSQL_ADDON_PORT') ?: 21917;

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    try {
        $conn = new mysqli($db_host, $db_user, $db_pass, $db_name_config, (int)$db_port);
        $conn->set_charset("utf8mb4");

        // --- TIMEZONE FIX (Synchronize DB and App to Philippine Time) ---
        date_default_timezone_set('Asia/Manila');
        $conn->query("SET time_zone = '+08:00'");

    } catch (Exception $e) {
        error_log("ERROR: Could not connect to database. " . $e->getMessage());
        return null;
    }
    mysqli_report(MYSQLI_REPORT_OFF);

    $db_connection = $conn;
    return $conn;
}

$conn = get_db_connection();
?>