<?php
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__ . '/../shared/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->sekolah_id) || !isset($data->amount)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
    exit();
}

try {
    $logStmt = $db->prepare("INSERT INTO activity_logs (sekolah_id, type, message, detail) VALUES (:sekolah_id, 'MINTA_SALDO', 'Minta Saldo', :detail)");
    $logStmt->execute([
        ':sekolah_id' => $data->sekolah_id,
        ':detail' => "Mengajukan permintaan saldo operasional sebesar Rp " . number_format($data->amount) . "."
    ]);

    echo json_encode(["status" => "success", "message" => "Aktivitas berhasil dicatat"]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
