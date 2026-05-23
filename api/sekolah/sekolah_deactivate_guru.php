<?php
include_once __DIR__ . '/../shared/config.php';
header("Content-Type: application/json");

// API untuk menonaktifkan data guru
// Payload: sekolah_id, guru_id

$data = json_decode(file_get_contents("php://input"), true);

$sekolah_id = $data['sekolah_id'] ?? null;
$guru_id = $data['guru_id'] ?? null;

if (!$sekolah_id || !$guru_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
    exit();
}

try {
    $db->beginTransaction();

    // Set is_active = 0 di tabel users untuk guru tersebut
    $stmtUser = $db->prepare("UPDATE users u JOIN guru g ON u.id = g.user_id SET u.is_active = 0 WHERE g.id = ? AND g.sekolah_id = ?");
    $stmtUser->execute([$guru_id, $sekolah_id]);

    // Log Aktivitas
    $logStmt = $db->prepare("INSERT INTO activity_logs (sekolah_id, type, message, detail) VALUES (:sekolah_id, 'DEACTIVATE_GURU', 'Nonaktifkan Guru', :detail)");
    $logStmt->execute([
        ':sekolah_id' => $sekolah_id,
        ':detail' => "Menonaktifkan akun guru dengan ID: " . $guru_id
    ]);

    $db->commit();
    echo json_encode(["status" => "success", "message" => "Guru berhasil dinonaktifkan"]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
