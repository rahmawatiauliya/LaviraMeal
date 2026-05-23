<?php
header("Content-Type: application/json");
include_once __DIR__ . '/../shared/config.php';

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if (!$user_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "User ID required"]);
    exit();
}

try {
    // Fetch notifications specifically for this canteen user
    $stmt = $db->prepare("SELECT id, title, message as comment, type, created_at FROM notifications WHERE role = 'kantin' AND user_id = ? ORDER BY created_at DESC LIMIT 15");
    $stmt->execute([$user_id]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => [
            "notifikasi" => $notifications
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
