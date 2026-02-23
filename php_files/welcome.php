<?php
session_start();

if (!isset($_SESSION['userID'])) {
    header("Location: login.html");
    exit();
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Member Dashboard</title>
    <link rel="stylesheet" href="../index.css">

    <style>
        /* Dashboard Specific */
        .dashboard-container {
            margin-left: 220px;
            padding: 40px;
            min-height: 100vh;
        }

        .search-bar {
            margin-bottom: 30px;
        }

        .search-bar input {
            width: 100%;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #333;
            background-color: #111;
            color: #eee;
            font-size: 16px;
        }

        .xp-container {
            position: fixed;
            bottom: 0;
            left: 220px;
            width: calc(100% - 220px);
            background-color: #000;
            padding: 15px;
        }

        .xp-bar {
            width: 100%;
            height: 25px;
            background-color: #333;
            border-radius: 20px;
            overflow: hidden;
        }

        .xp-fill {
            height: 100%;
            width: 0%;
            background: linear-gradient(135deg, #b30000, #ff4d4d);
            transition: width 0.4s ease;
        }

        .xp-text {
            text-align: center;
            margin-top: 8px;
            font-size: 14px;
            color: #ccc;
        }
    </style>
</head>

<body>

<!-- Sidebar -->
<nav>
    <ul>
        <li><a href="#" class="active">Dashboard</a></li>
        <li><a href="../index.html">Home</a></li>
        <li><a href="logout.php">Logout</a></li>
    </ul>
</nav>

<!-- Main Dashboard -->
<div class="dashboard-container">

    <h2>Welcome back, <?php echo htmlspecialchars($_SESSION['firstName']); ?> 💪</h2>

    <!-- Search Bar (inactive) -->
    <div class="search-bar">
        <input type="text" placeholder="Search workouts, exercises, stats... (coming soon)">
    </div>

    <!-- Workout Panel -->
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

</div>

<!-- XP Bar -->
<div class="xp-container">
    <div class="xp-bar">
        <div class="xp-fill" id="xpFill"></div>
    </div>
    <div class="xp-text">
        Experience: <span id="xpValue">0</span> / 100
    </div>
</div>

<script>
    let xp = 0;
    const maxXP = 100;

    function addXP(amount) {
        xp += amount;

        if (xp > maxXP) {
            xp = maxXP;
        }

        document.getElementById("xpValue").innerText = xp;
        document.getElementById("xpFill").style.width = xp + "%";
    }
</script>

</body>
</html>

