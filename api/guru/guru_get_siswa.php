<?php
include_once __DIR__ . '/../shared/config.php';

header("Content-Type: application/json");

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "User ID required"]);
    exit();
}

try {
    // 1. Get Guru & Kelas Info
    $stmt = $db->prepare("SELECT sekolah_id, kelas_wali FROM guru WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $guru = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$guru) {
        echo json_encode(["status" => "error", "message" => "Data guru tidak ditemukan untuk User ID: $user_id. Pastikan akun Anda sudah terdaftar sebagai Guru oleh Admin Sekolah."]);
        exit();
    }

    $sekolah_id = $guru['sekolah_id'];
    $kelas_wali = $guru['kelas_wali'];

    // 2. Get Students in Class
    $stmtSiswa = $db->prepare("SELECT id, nis, nama, kelas, jenis_kelamin, is_active as aktif 
                               FROM siswa 
                               WHERE sekolah_id = ? AND kelas = ? 
                               ORDER BY nama ASC");
    $stmtSiswa->execute([$sekolah_id, $kelas_wali]);
    $siswa = $stmtSiswa->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $siswa
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
