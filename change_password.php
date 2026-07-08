<?php
session_start();
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $current_password = $_POST['current_password'] ?? '';
    $new_password = $_POST['new_password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';

    if ($new_password !== $confirm_password) {
        echo json_encode(['success' => false, 'message' => 'New passwords do not match!']);
        exit;
    }

    if (strlen($new_password) < 4) {
        echo json_encode(['success' => false, 'message' => 'New password must be at least 4 characters.']);
        exit;
    }

    // Load current credentials
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

    // Verify current password
    if (!password_verify($current_password, $valid_hash)) {
        echo json_encode(['success' => false, 'message' => 'Current password is incorrect!']);
        exit;
    }

    // Save new password
    $new_hash = password_hash($new_password, PASSWORD_DEFAULT);
    $new_data = [
        'username' => $valid_username,
        'hash' => $new_hash
    ];

    if (file_put_contents($cred_file, json_encode($new_data, JSON_PRETTY_PRINT))) {
        echo json_encode(['success' => true, 'message' => 'Password updated successfully!']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to save new password. Check file permissions.']);
    }
}
?>
