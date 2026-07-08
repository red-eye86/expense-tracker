<?php
session_start();
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header('HTTP/1.1 401 Unauthorized');
    echo json_encode(["status" => "error", "message" => "Unauthorized access"]);
    exit;
}

header('Content-Type: application/json');
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "expense_tracker";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Compatibility upgrade for existing installations: retain and store transaction notes.
    $notesColumn = $conn->query("SHOW COLUMNS FROM transactions LIKE 'notes'")->fetch();
    if (!$notesColumn) {
        $conn->exec("ALTER TABLE transactions ADD COLUMN notes VARCHAR(500) NULL AFTER toAccount");
    }
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database Connection Failed: " . $e->getMessage()]);
    exit;
}

function readJsonBody() {
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : null;
}
function requiredTransaction($data) {
    return $data && isset($data['date'], $data['account'], $data['description'], $data['category'], $data['type'], $data['amount']);
}

$action = $_GET['action'] ?? '';
switch($action) {
    case 'get_transactions':
        $stmt = $conn->query("SELECT * FROM transactions ORDER BY date DESC, id DESC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;
    case 'get_investments':
        $stmt = $conn->query("SELECT * FROM investments ORDER BY sn ASC, id ASC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;
    case 'add_transaction':
        $data = readJsonBody();
        if (!requiredTransaction($data)) { echo json_encode(["status"=>"error", "message"=>"Missing transaction fields"]); break; }
        $stmt = $conn->prepare("INSERT INTO transactions (date, account, description, category, type, amount, toAccount, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$data['date'], $data['account'], $data['description'], $data['category'], $data['type'], $data['amount'], $data['toAccount'] ?? null, $data['notes'] ?? null]);
        echo json_encode(["status"=>"success", "id"=>$conn->lastInsertId()]);
        break;
    case 'update_transaction':
        $data = readJsonBody();
        if (!requiredTransaction($data) || !isset($data['id'])) { echo json_encode(["status"=>"error", "message"=>"Missing transaction fields"]); break; }
        $stmt = $conn->prepare("UPDATE transactions SET date=?, account=?, description=?, category=?, type=?, amount=?, toAccount=?, notes=? WHERE id=?");
        $stmt->execute([$data['date'], $data['account'], $data['description'], $data['category'], $data['type'], $data['amount'], $data['toAccount'] ?? null, $data['notes'] ?? null, $data['id']]);
        echo json_encode(["status"=>"success"]);
        break;
    case 'delete_transaction':
        $data = readJsonBody();
        if (!isset($data['id'])) { echo json_encode(["status"=>"error", "message"=>"No ID provided"]); break; }
        $stmt = $conn->prepare("DELETE FROM transactions WHERE id = ?");
        $stmt->execute([$data['id']]);
        echo json_encode(["status"=>"success"]);
        break;
    case 'sync_transactions':
        $rows = readJsonBody();
        if (!is_array($rows)) { echo json_encode(["status"=>"error", "message"=>"Invalid array data"]); break; }
        $conn->exec("TRUNCATE TABLE transactions");
        $stmt = $conn->prepare("INSERT INTO transactions (date, account, description, category, type, amount, toAccount, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        foreach ($rows as $data) if (requiredTransaction($data)) $stmt->execute([$data['date'], $data['account'], $data['description'], $data['category'], $data['type'], $data['amount'], $data['toAccount'] ?? null, $data['notes'] ?? null]);
        echo json_encode(["status"=>"success"]);
        break;
    case 'sync_investments':
        $rows = readJsonBody();
        if (!is_array($rows)) { echo json_encode(["status"=>"error", "message"=>"Invalid array data"]); break; }
        $conn->exec("TRUNCATE TABLE investments");
        $stmt = $conn->prepare("INSERT INTO investments (sn, inv, plan, status, amount, start, dop, platform, num, app, policy, bank) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        foreach($rows as $data) $stmt->execute([$data['sn'],$data['inv'],$data['plan'],$data['status'],$data['amount'],$data['start'],$data['dop'],$data['platform'],$data['num'],$data['app'],$data['policy'],$data['bank']]);
        echo json_encode(["status"=>"success"]);
        break;
    default:
        echo json_encode(["status"=>"error", "message"=>"Invalid Action"]);
}
?>
