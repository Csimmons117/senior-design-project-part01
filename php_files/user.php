<?php
// newMember.php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Database connection info
$servername = "192.168.1.158";   // ← your database server IP
$username = "senior";               // ← replace with your DB username
$password = "senior";                   // ← replace with your DB password
$dbname = "csun_database";        // ← replace with your DB name

// Create a new MySQL connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check for connection errors
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Collect POST data safely
$firstName = $_POST['firstName'] ?? '';
$lastName  = $_POST['lastName'] ?? '';
$studentID = $_POST['studentID'] ?? '';
$email     = $_POST['email'] ?? '';
$userName  = $_POST['userName'] ?? '';
$password  = $_POST['password'] ?? '';

// Basic validation
if (empty($firstName) || empty($lastName) || empty($studentID) || empty($email) || empty($userName) || empty($password)) {
    die("Error: Please fill in all fields.");
}

// Hash the password before storing
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Prepare the SQL insert statement
$stmt = $conn->prepare("
    INSERT INTO users (firstName, lastName, studentID, email, userName, password)
    VALUES (?, ?, ?, ?, ?, ?)
");

if (!$stmt) {
    die("SQL error: " . $conn->error);
}

$stmt->bind_param("ssisss", $firstName, $lastName, $studentID, $email, $userName, $hashedPassword);

// Execute and handle results
if ($stmt->execute()) {

    // Redirect user to login page after successful registration
    header("Location:../html_files/login.html");
    exit(); // important to stop script execution

} else {
    echo "❌ Error inserting record: " . $stmt->error;
}

// Close connections
$stmt->close();
$conn->close();
?>