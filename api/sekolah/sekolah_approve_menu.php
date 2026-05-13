<?php
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__ . '/../shared/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->menu_id) || !isset($data->status)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
    exit();
}

try {
    $stmt = $db->prepare("UPDATE menu_kantin SET status = :status WHERE id = :id");
    $stmt->execute([
        ':status' => $data->status,
        ':id' => $data->menu_id
    ]);

    echo json_encode([
        "status" => "success",
        "message" => "Status menu diperbarui menjadi " . $data->status
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
