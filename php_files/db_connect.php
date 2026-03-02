<?php
// db_connect.php

$servername = "192.168.8.220";
$username   = "webuser";
$password   = "webuser";
$dbname     = "csun_database";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}
?>
