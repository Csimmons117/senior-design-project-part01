<?php
session_start();

ini_set('display_errors', 1);
error_reporting(E_ALL);

$servername = "192.168.1.158";
$usernameDB = "senior";
$passwordDB = "senior";
$dbname = "csun_database";

$conn = new mysqli($servername, $usernameDB, $passwordDB, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$userName = $_POST['userName'] ?? '';
$password = $_POST['password'] ?? '';

$stmt = $conn->prepare(
    "SELECT studentID, userName, firstName, lastName, password
     FROM users WHERE userName = ?"
);
$stmt->bind_param("s", $userName);
$stmt->execute();
$result = $stmt->get_result();

/* USER NOT FOUND */
if ($result->num_rows === 0) {
    echo "<script>
        alert('Account not found. Please create an account.');
        window.location.href = '/html_files/login.html';
    </script>";
    exit();
}

/* USER FOUND */
$user = $result->fetch_assoc();

/* PASSWORD CHECK */
if (password_verify($password, $user['password'])) {

    $_SESSION['userID']    = $user['studentID'];
    $_SESSION['firstName'] = $user['firstName'];
    $_SESSION['lastName']  = $user['lastName'];

    header('Location: /php_files/welcome.php');
    exit();
}

/* WRONG PASSWORD */
echo "<script>
    alert('Incorrect password. Please try again.');
    window.location.href = '/html_files/login.html';
</script>";

$stmt->close();
$conn->close();
?>