<?php
/**
 * Migration: Add last_maintained and last_changed columns to pms_room_items table
 * This file should be run once to update the database schema
 */

// Include database connection
require_once(__DIR__ . '/../db_connection.php');

try {
    $conn = get_db_connection('bt3wljbwprykeblz7tvq');
    if ($conn === null) {
        throw new Exception('Database connection failed');
    }

    // Check if columns already exist
    $checkSQL = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_NAME = 'pms_room_items' 
                 AND COLUMN_NAME IN ('last_maintained', 'last_changed')";
    
    $result = $conn->query($checkSQL);
    $existingColumns = [];
    
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $existingColumns[] = $row['COLUMN_NAME'];
        }
    }

    $alterQueries = [];

    // Add last_maintained column if it doesn't exist
    if (!in_array('last_maintained', $existingColumns)) {
        $alterQueries[] = "ALTER TABLE pms_room_items ADD COLUMN last_maintained DATETIME NULL DEFAULT NULL COMMENT 'Last maintenance date for equipment'";
    }

    // Add last_changed column if it doesn't exist
    if (!in_array('last_changed', $existingColumns)) {
        $alterQueries[] = "ALTER TABLE pms_room_items ADD COLUMN last_changed DATETIME NULL DEFAULT NULL COMMENT 'Last changed date for reusable items'";
    }

    // Execute ALTER TABLE queries
    if (!empty($alterQueries)) {
        foreach ($alterQueries as $query) {
            if ($conn->query($query)) {
                echo "✓ Successfully executed: " . substr($query, 0, 50) . "...\n";
            } else {
                echo "✗ Error executing query: " . $conn->error . "\n";
            }
        }
        echo "\n✓ Migration completed successfully!\n";
    } else {
        echo "✓ All columns already exist. No migration needed.\n";
    }

    $conn->close();

} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
