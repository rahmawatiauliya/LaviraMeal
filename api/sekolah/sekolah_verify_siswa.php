<?php
include_once __DIR__ . '/../shared/config.php';

header("Content-Type: application/json");

// API untuk verifikasi data siswa (individual atau per kelas)
// Payload: sekolah_id, (siswa_id ATAU kelas)

$data = json_decode(file_get_contents("php://input"), true);

$sekolah_id = $data['sekolah_id'] ?? null;
$siswa_id = $data['siswa_id'] ?? null;
$kelas = $data['kelas'] ?? null;

if (!$sekolah_id || (!$siswa_id && !$kelas)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
    exit();
}

try {
    $db->beginTransaction();

    if ($siswa_id) {
        // Verifikasi individual
        $stmt = $db->prepare("UPDATE siswa SET is_active = 1 WHERE id = ? AND sekolah_id = ?");
        $stmt->execute([$siswa_id, $sekolah_id]);

        // Aktifkan juga akun user-nya
        $stmtUser = $db->prepare("UPDATE users u JOIN siswa s ON u.id = s.user_id SET u.is_active = 1 WHERE s.id = ?");
        $stmtUser->execute([$siswa_id]);

        $message = "Siswa berhasil diverifikasi";
    } else {
        // Verifikasi per kelas
        $stmt = $db->prepare("UPDATE siswa SET is_active = 1 WHERE sekolah_id = ? AND kelas = ?");
        $stmt->execute([$sekolah_id, $kelas]);

        // Aktifkan semua akun user di kelas tersebut
        $stmtUser = $db->prepare("UPDATE users u JOIN siswa s ON u.id = s.user_id SET u.is_active = 1 WHERE s.sekolah_id = ? AND s.kelas = ?");
        $stmtUser->execute([$sekolah_id, $kelas]);

        $count = $stmt->rowCount();
        $message = "Berhasil memverifikasi $count siswa di kelas $kelas";
    }

    $db->commit();
    echo json_encode(["status" => "success", "message" => $message]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
