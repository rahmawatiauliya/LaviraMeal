<?php
include_once __DIR__ . '/config.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->post_id) || !isset($data->admin_id) || !isset($data->komentar)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete data"]);
    exit();
}

try {
    $stmt = $db->prepare("INSERT INTO menu_kantin_komentar (menu_kantin_id, admin_id, komentar) VALUES (?, ?, ?)");
    $stmt->execute([$data->post_id, $data->admin_id, $data->komentar]);

    echo json_encode([
        "status" => "success",
        "message" => "Komentar berhasil ditambahkan"
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
