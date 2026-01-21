<?php
// Display errors (for debugging)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database connection info
$servername = "192.168.1.158";   // e.g., 127.0.0.1 or your server IP
$username = "root";     // e.g., root
$password = "root";     // e.g., root
$dbname   = "csun_database";     // e.g., csun_database

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

echo "✅ PHP can connect to MySQL successfully!";

// Close connection
$conn->close();
?>