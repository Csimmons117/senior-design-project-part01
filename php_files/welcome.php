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
    <title>Welcome</title>
    <link rel="stylesheet" href="../index.css">
</head>

<body>

<div class="logoBox">
    <a href="../index.html"><img src="../pictures/unnamed-Photoroom.png" class="logo"></a>
    <h1>Student Recreation Center</h1>
</div>

<hr>

<nav>
    <ul>
        <li><a href="../index.html">Home</a></li>
        <li><a href="../html_files/staffMember.html">Staff Members</a></li>
        <li><a href="../html_files/events.html">Events</a></li>
        <li><a href="../html_files/signUp.html">Registration</a></li>
        <li><a href="../html_files/login.html">Login</a></li>
    </ul>
</nav>

<div class="title">
    <h1>Welcome, <?php echo htmlspecialchars($_SESSION['firstName']); ?>!</h1>
</div>


<div class="boxer" style="text-align: center;">
    <p style="margin-bottom: 20px;">
        You have successfully logged in to the Student Recreation Center portal.
    </p>

    <a href="logout.php" style="display: inline-block; margin-top: 10px;">
        <button style="font-size: 20px; padding: 10px;">Logout</button>
    </a>
</div>



</body>

</html>