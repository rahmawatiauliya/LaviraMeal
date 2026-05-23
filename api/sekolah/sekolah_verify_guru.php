<?php
include_once __DIR__ . '/../shared/config.php';

header("Content-Type: application/json");

// API untuk verifikasi data guru (individual atau masal)
// Payload: sekolah_id, (guru_id ATAU mass_verify=true)

$data = json_decode(file_get_contents("php://input"), true);

$sekolah_id = $data['sekolah_id'] ?? null;
$guru_id = $data['guru_id'] ?? null;
$mass_verify = $data['mass_verify'] ?? false;

if (!$sekolah_id || (!$guru_id && !$mass_verify)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
    exit();
}

try {
    $db->beginTransaction();

    if ($guru_id) {
        // Verifikasi individual
        $stmtUser = $db->prepare("UPDATE users u JOIN guru g ON u.id = g.user_id SET u.is_active = 1 WHERE g.id = ? AND g.sekolah_id = ?");
        $stmtUser->execute([$guru_id, $sekolah_id]);
        $message = "Guru berhasil diverifikasi";
    } else {
        // Verifikasi masal (semua guru di sekolah ini)
        $stmtUser = $db->prepare("UPDATE users u JOIN guru g ON u.id = g.user_id SET u.is_active = 1 WHERE g.sekolah_id = ?");
        $stmtUser->execute([$sekolah_id]);
        $count = $stmtUser->rowCount();
        $message = "Berhasil memverifikasi $count guru";
    }

    $db->commit();
    echo json_encode(["status" => "success", "message" => $message]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
