<?php
$host = "localhost";
$user = "root";
$password = "";
$database = "pms"; 

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    error_log("ERROR: Could not connect. " . $conn->connect_error);
    http_response_code(500);
    die("Database connection failed: " . $conn->connect_error);
}


?>