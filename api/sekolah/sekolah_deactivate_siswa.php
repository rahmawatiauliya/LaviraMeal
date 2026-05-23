<?php
include_once __DIR__ . '/../shared/config.php';
header("Content-Type: application/json");

// API untuk menonaktifkan data siswa
// Payload: sekolah_id, siswa_id

$data = json_decode(file_get_contents("php://input"), true);

$sekolah_id = $data['sekolah_id'] ?? null;
$siswa_id = $data['siswa_id'] ?? null;

if (!$sekolah_id || !$siswa_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
    exit();
}

try {
    $db->beginTransaction();

    // 1. Set is_active = 0 di tabel siswa
    $stmt = $db->prepare("UPDATE siswa SET is_active = 0 WHERE id = ? AND sekolah_id = ?");
    $stmt->execute([$siswa_id, $sekolah_id]);

    // 2. Set is_active = 0 di tabel users
    $stmtUser = $db->prepare("UPDATE users u JOIN siswa s ON u.id = s.user_id SET u.is_active = 0 WHERE s.id = ?");
    $stmtUser->execute([$siswa_id]);

    // 3. Log Aktivitas
    $logStmt = $db->prepare("INSERT INTO activity_logs (sekolah_id, type, message, detail) VALUES (:sekolah_id, 'DEACTIVATE_SISWA', 'Nonaktifkan Siswa', :detail)");
    $logStmt->execute([
        ':sekolah_id' => $sekolah_id,
        ':detail' => "Menonaktifkan akun siswa dengan ID: " . $siswa_id
    ]);

    $db->commit();
    echo json_encode(["status" => "success", "message" => "Siswa berhasil dinonaktifkan"]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
