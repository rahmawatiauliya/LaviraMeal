<?php
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__ . '/../shared/config.php';

$data = json_decode(file_get_contents("php://input"), true);

$kantin_id = $data['kantin_id'] ?? null;
$user_id = $data['user_id'] ?? null;

if (!$kantin_id || !$user_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "ID Kantin dan User diperlukan"]);
    exit();
}

try {
    $db->beginTransaction();

    // 1. Update status di tabel kantin
    $stmt1 = $db->prepare("UPDATE kantin SET is_aktif = 1 WHERE id = ?");
    $stmt1->execute([$kantin_id]);

    // 2. Aktifkan user kantin agar bisa login
    $stmt2 = $db->prepare("UPDATE users SET is_active = 1 WHERE id = ?");
    $stmt2->execute([$user_id]);

    $db->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Kantin berhasil disetujui dan kini aktif."
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
