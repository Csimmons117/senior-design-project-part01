<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();

if (!isset($_SESSION['userID'])) {
    exit("Not logged in");
}

require_once "db_connect.php";

$studentID = $_SESSION['userID'];
$newXP = (int)($_POST['xp'] ?? 0);
$today = date("Y-m-d");

/* Update XP */
$stmt = $conn->prepare("UPDATE users SET xp = ? WHERE studentID = ?");
$stmt->bind_param("ii", $newXP, $studentID);
$stmt->execute();
$stmt->close();

/* Insert workout day (ignore if already exists) */
$stmt = $conn->prepare("
    INSERT IGNORE INTO workout_days (studentID, workout_date)
    VALUES (?, ?)
");
$stmt->bind_param("is", $studentID, $today);
$stmt->execute();
$stmt->close();

$conn->close();

echo "Updated";
?>
