<?php
session_start();

// Default credentials if no config exists
$valid_username = "admin";
$valid_hash = password_hash("admin123", PASSWORD_DEFAULT);

$cred_file = 'credentials.json';
if (file_exists($cred_file)) {
    $data = json_decode(file_get_contents($cred_file), true);
    if ($data && isset($data['username']) && isset($data['hash'])) {
        $valid_username = $data['username'];
        $valid_hash = $data['hash'];
    }
}

$error = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    if ($username === $valid_username && password_verify($password, $valid_hash)) {
        session_regenerate_id(true);
        $_SESSION['logged_in'] = true;
        header("Location: index.php");
        exit;
    } else {
        $error = "Invalid username or password!";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Expense Tracker</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #6c5ce7;
            --primary-hover: #5b4bc4;
            --bg-color: #f4f7fe;
            --card-bg: #ffffff;
            --text-main: #2d3436;
            --danger-color: #ff7675;
        }
        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-color);
            color: var(--text-main);
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .login-card {
            background: var(--card-bg);
            padding: 2.5rem;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            width: 100%;
            max-width: 400px;
            text-align: center;
        }
        h1 {
            color: var(--primary-color);
            margin-bottom: 0.5rem;
        }
        p {
            color: #636e72;
            margin-bottom: 2rem;
        }
        .form-group {
            margin-bottom: 1.5rem;
            text-align: left;
        }
        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            font-size: 0.9rem;
        }
        input {
            width: 100%;
            padding: 0.8rem 1rem;
            border: 2px solid #dfe6e9;
            border-radius: 10px;
            font-size: 1rem;
            transition: all 0.3s;
            box-sizing: border-box;
            font-family: 'Inter', sans-serif;
        }
        input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.2);
        }
        button {
            width: 100%;
            padding: 1rem;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        button:hover {
            background: var(--primary-hover);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(108, 92, 231, 0.3);
        }
        .error {
            color: var(--danger-color);
            margin-bottom: 1rem;
            font-size: 0.9rem;
            font-weight: 500;
        }
    </style>
</head>
<body>

    <div class="login-card">
        <h1>💰 Welcome Back</h1>
        <p>Please login to your Expense Tracker</p>

        <?php if ($error): ?>
            <div class="error"><?php echo $error; ?></div>
        <?php endif; ?>

        <form method="POST" action="login.php">
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" required autocomplete="username">
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required autocomplete="current-password">
            </div>
            <button type="submit">Login to Tracker</button>
        </form>
    </div>

</body>
</html>
