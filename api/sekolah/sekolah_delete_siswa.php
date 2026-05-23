<?php
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__ . '/../shared/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->sekolah_id) || !isset($data->siswa_id)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
    exit();
}

try {
    $db->beginTransaction();

    // 1. Ambil user_id dari siswa tersebut sebelum dihapus
    $stmtUser = $db->prepare("SELECT user_id FROM siswa WHERE id = :id AND sekolah_id = :sid");
    $stmtUser->execute([':id' => $data->siswa_id, ':sid' => $data->sekolah_id]);
    $siswa = $stmtUser->fetch(PDO::FETCH_ASSOC);

    if (!$siswa) {
        throw new Exception("Siswa tidak ditemukan atau bukan milik sekolah ini");
    }

    // 2. Hapus dari tabel siswa
    $stmtDelSiswa = $db->prepare("DELETE FROM siswa WHERE id = :id");
    $stmtDelSiswa->execute([':id' => $data->siswa_id]);

    // 3. Hapus dari tabel users (agar akun tidak bisa login lagi)
    if ($siswa['user_id']) {
        $stmtDelUser = $db->prepare("DELETE FROM users WHERE id = :uid");
        $stmtDelUser->execute([':uid' => $siswa['user_id']]);
    }

    // 4. Log Aktivitas
    $logStmt = $db->prepare("INSERT INTO activity_logs (sekolah_id, type, message, detail) VALUES (:sekolah_id, 'DELETE_SISWA', 'Hapus Siswa', :detail)");
    $logStmt->execute([
        ':sekolah_id' => $data->sekolah_id,
        ':detail' => "Menghapus akun siswa dengan ID: " . $data->siswa_id
    ]);

    $db->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Siswa dan akun berhasil dihapus"
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
