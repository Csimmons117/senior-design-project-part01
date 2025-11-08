f ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
        }

        // Collect POST data safely
        // $firstName = $_POST['firstName'] ?? '';
        // $lastName  = $_POST['lastName'] ?? '';
        // $studentID = $_POST['studentID'] ?? '';
        // $email     = $_POST['email'] ?? '';
        // $userName  = $_POST['userName'] ?? '';
        // $password  = $_POST['password'] ?? '';
        //
        // // Basic validation
        // if (empty($firstName) || empty($lastName) || empty($studentID) || empty($email) || empty($userName) || empty($password)) {
        //     die("Error: Please fill in all fields.");
        // }
        //
        // // Hash the password before storing
        // $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        //
        // // Prepare the SQL insert statement
        // $stmt = $conn->prepare("
        //     INSERT INTO newMember (firstName, lastName, studentID, email, userName, password)
        //     VALUES (?, ?, ?, ?, ?, ?)
        // ");
        //
        // if (!$stmt) {
        //     die("SQL error: " . $conn->error);
        // }
        //
        // $stmt->bind_param("ssisss", $firstName, $lastName, $studentID, $email, $userName, $hashedPassword);
        //
        // // Execute and handle results
        // if ($stmt->execute()) {
        //     echo "✅ New member added successfully!";
        // } else {
        //     echo "❌ Error inserting record: " . $stmt->error;
        // }
        //
        // // Close connections
        // $stmt->close();
        // $conn->close();
        // ?>
        // 
}
