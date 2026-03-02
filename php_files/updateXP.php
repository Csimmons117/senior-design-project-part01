<?php
session_start();
require_once "db_connect.php";

if (!isset($_SESSION['userID'])) {
    exit();
}

$userID = $_SESSION['userID'];
$newXP = intval($_POST['xp']);

$sql = "UPDATE members SET xp = ? WHERE userID = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $newXP, $userID);
$stmt->execute();

echo "success";
?>
