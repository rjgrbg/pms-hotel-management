<?php
// fetch_filters.php
header('Content-Type: application/json');
// Enable error reporting for debugging (remove this line in production)
error_reporting(E_ALL); ini_set('display_errors', 0);

require_once 'db_connection.php'; 

if (!isset($conn) || $conn->connect_error) {
    die(json_encode(['error' => 'Database connection failed']));
}

// 1. FLOORS
$floors = [];
$result = $conn->query("SELECT DISTINCT floor_num FROM tbl_rooms WHERE floor_num IS NOT NULL ORDER BY floor_num ASC");
if ($result) while($row = $result->fetch_assoc()) $floors[] = $row['floor_num'];

// 2. ROOMS
$rooms = [];
$result = $conn->query("SELECT room_num, floor_num FROM tbl_rooms ORDER BY room_num ASC");
if ($result) while($row = $result->fetch_assoc()) $rooms[] = $row;

// 3. CATEGORIES (The important part!)
$categories = [];
$catSql = "SELECT ItemCategoryName FROM pms_itemcategory ORDER BY ItemCategoryName ASC";
$result = $conn->query($catSql);

if ($result) {
    while($row = $result->fetch_assoc()) {
        $categories[] = $row['ItemCategoryName'];
    }
} else {
    // If query fails, add a debug error to the JSON
    $categories[] = "Error: " . $conn->error;
}

echo json_encode([
    'floors' => $floors,
    'rooms' => $rooms,
    'categories' => $categories
]);
?>