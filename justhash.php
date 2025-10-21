<?php
// 🚨 IMPORTANT: Replace 'MyTestPassword123' with the actual password you want to use.
$password_to_hash = 'admin'; 

// This function creates the secure, long hash string.
$hashed_password = password_hash($password_to_hash, PASSWORD_DEFAULT);

echo "The secure hash you need to use is: <br>";
echo "<strong>" . $hashed_password . "</strong>";

// Note: The output will look something like: $2y$10$....................................
?>