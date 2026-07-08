<?php
// db_setup.php
$servername = "localhost";
$username = "root";
$password = "your_db_password";

try {
    // Create connection
    $conn = new PDO("mysql:host=$servername", $username, $password);
    // Set the PDO error mode to exception
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create database
    $sql = "CREATE DATABASE IF NOT EXISTS expense_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
    $conn->exec($sql);
    echo "<div style='color: green;'>Database created successfully or already exists.</div><br>";

    // Connect to the new database
    $conn->exec("USE expense_tracker");

    // Create Transactions Table
    $sqlTransactions = "CREATE TABLE IF NOT EXISTS transactions (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        date VARCHAR(20) NOT NULL,
        account VARCHAR(100) NOT NULL,
        description VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        toAccount VARCHAR(100),
        notes VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $conn->exec($sqlTransactions);

    // Upgrade existing installations that were created before transaction notes were added.
    $hasNotes = $conn->query("SHOW COLUMNS FROM transactions LIKE 'notes'")->fetch();
    if (!$hasNotes) {
        $conn->exec("ALTER TABLE transactions ADD COLUMN notes VARCHAR(500) NULL AFTER toAccount");
    }
    echo "<div style='color: green;'>Table 'transactions' created successfully.</div><br>";

    // Create Investments Table
    $sqlInvestments = "CREATE TABLE IF NOT EXISTS investments (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        sn INT(11),
        inv VARCHAR(100),
        plan VARCHAR(255),
        status VARCHAR(50),
        amount VARCHAR(50),
        start VARCHAR(50),
        dop VARCHAR(50),
        platform VARCHAR(100),
        num VARCHAR(50),
        app VARCHAR(50),
        policy VARCHAR(100),
        bank VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $conn->exec($sqlInvestments);
    echo "<div style='color: green;'>Table 'investments' created successfully.</div><br>";

    echo "<h3><a href='index.php'>Go back to Dashboard</a></h3>";

} catch(PDOException $e) {
    echo "<div style='color: red;'>Connection failed: " . $e->getMessage() . "</div>";
}
?>
