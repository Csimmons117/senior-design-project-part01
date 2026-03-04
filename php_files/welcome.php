<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();

if (!isset($_SESSION['userID'])) {
    header("Location: ../html_files/login.html");
    exit();
}

require_once "db_connect.php";

$studentID = $_SESSION['userID'];

/* =========================
   Get XP + Name
========================= */
$stmt = $conn->prepare("SELECT xp, firstName FROM users WHERE studentID = ?");
$stmt->bind_param("i", $studentID);
$stmt->execute();
$result = $stmt->get_result();
$userData = $result->fetch_assoc();

$currentXP = $userData['xp'] ?? 0;
$firstName = $userData['firstName'] ?? "Member";

$stmt->close();

/* =========================
   Get Workout Days
========================= */
$stmt = $conn->prepare("
    SELECT workout_date
    FROM workout_days
    WHERE studentID = ?
");
$stmt->bind_param("i", $studentID);
$stmt->execute();
$result = $stmt->get_result();

$workoutDays = [];
while ($row = $result->fetch_assoc()) {
    $workoutDays[] = $row['workout_date'];
}

$stmt->close();
$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Member Dashboard</title>
<link rel="stylesheet" href="../index.css">

<style>
/* ===== Calendar Visibility Fix ===== */
.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 40px);
    gap: 8px;
    margin-top: 15px;
}

.day {
    width: 40px;
    height: 40px;
    background-color: #333;
    border-radius: 6px;
    border: 1px solid #555;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #ccc;
}

.active-day {
    background: linear-gradient(135deg, #b30000, #ff4d4d);
    color: white;
    box-shadow: 0 0 8px rgba(255,77,77,0.8);
}

.today {
    border: 2px solid #ff4d4d;
}
</style>

</head>

<body>

<header class="hero">
    <div class="hero-content">
        <h1>Member Dashboard</h1>
        <h3>Welcome back, <?php echo htmlspecialchars($firstName); ?> </h3>
    </div>
</header>

<div class="layout">

<!-- Sidebar -->
<aside class="sidebar">
    <nav>
        <a class="active" href="#">Dashboard</a>
        <a href="../html_files/aiTrainer.html">AI Fitness Helper</a>
	<a href="../html_files/aiTrainerBACK.html">FAKE AI TEST</a>
        <a href="logout.php">Logout</a>
    </nav>
</aside>

<!-- Main Content -->
<main class="content">

<h2>Track Your Workout</h2>

<!-- Workout Buttons -->
<div class="panel">
    <h3>What did you work on today?</h3>

    <div class="button-group">
        <button onclick="addXP(10)">Legs</button>
        <button onclick="addXP(10)">Back</button>
        <button onclick="addXP(10)">Chest</button>
        <button onclick="addXP(8)">Abs</button>
        <button onclick="addXP(5)">Walking</button>
        <button onclick="addXP(7)">Running</button>
    </div>
</div>

<!-- XP Panel -->
<div class="panel">
    <h3>Experience</h3>
    <p><span id="xpValue"></span> / 100</p>
    <div style="width:100%;height:25px;background:#333;border-radius:20px;overflow:hidden;">
        <div id="xpFill" style="height:100%;background:linear-gradient(135deg,#b30000,#ff4d4d);"></div>
    </div>
</div>

<!-- Consistency Calendar -->
<div class="panel">
    <h3>Consistency Tracker</h3>

    <div class="calendar-grid">
    <?php
        $currentYear = date("Y");
        $currentMonth = date("m");
        $daysInMonth = date("t");
        $today = date("Y-m-d");

        for ($day = 1; $day <= $daysInMonth; $day++) {

            $date = $currentYear . "-" . $currentMonth . "-" . str_pad($day, 2, "0", STR_PAD_LEFT);

            $active = in_array($date, $workoutDays) ? "active-day" : "";
            $isToday = ($date == $today) ? "today" : "";

            echo "<div class='day $active $isToday' title='$date'>$day</div>";
        }
    ?>
    </div>

</div>

</main>
</div>

<footer class="footer">
    <p>© 2026 Student Recreation Center</p>
</footer>

<script>
let xp = <?php echo (int)$currentXP; ?>;
const maxXP = 100;

window.onload = function() {
    updateXPBar();
}

function updateXPBar() {
    document.getElementById("xpValue").innerText = xp;
    document.getElementById("xpFill").style.width = xp + "%";
}

function addXP(amount) {
    xp += amount;
    if (xp > maxXP) xp = maxXP;

    updateXPBar();

    fetch("updateXP.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "xp=" + xp
    }).then(() => location.reload());
}
</script>

</body>
</html>
