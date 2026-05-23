<?php
header("Content-Type: application/json");
include_once __DIR__ . '/../shared/config.php';

$kantin_id = $_GET['kantin_id'] ?? '';

if (empty($kantin_id)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Kantin ID diperlukan"]);
    exit;
}

try {
    $stmt = $db->prepare("SELECT * FROM menu_harian WHERE kantin_id = ? ORDER BY tanggal DESC, created_at DESC LIMIT 30");
    $stmt->execute([$kantin_id]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $data
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
