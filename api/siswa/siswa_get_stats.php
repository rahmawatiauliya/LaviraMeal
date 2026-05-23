<?php
include_once __DIR__ . '/../shared/config.php';

header("Content-Type: application/json");

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "User ID required"]);
    exit();
}

try {
    // 1. Ambil Saldo & Data Dasar dari tabel siswa
    $stmt = $db->prepare("SELECT s.id as siswa_internal_id, s.saldo, s.nama, s.nis, s.kelas, s.qr_code_token FROM siswa s WHERE s.user_id = ?");
    $stmt->execute([$user_id]);
    $siswa = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$siswa) {
        echo json_encode(["status" => "error", "message" => "Data siswa tidak ditemukan untuk user_id: $user_id"]);
        exit();
    }

    $siswa_internal_id = $siswa['siswa_internal_id'];

    // 2. Cek apakah sudah ambil makan hari ini
    $stmtAbsen = $db->prepare("SELECT id FROM siswa_pengambilan_mbg WHERE siswa_id = ? AND DATE(tanggal) = CURDATE()");
    $stmtAbsen->execute([$siswa_internal_id]);
    $sudah_ambil = $stmtAbsen->rowCount() > 0 ? 'Sudah' : 'Belum';

    // 3. Ambil Riwayat Terakhir (UNION antara Transaksi Finansial & Pengambilan Makan)
    $stmtHistory = $db->prepare("
        (SELECT created_at, message, nominal as amount, type 
         FROM transaksi_siswa 
         WHERE siswa_id = ?)
        UNION ALL
        (SELECT tanggal as created_at, 'Pengambilan Makan Bergizi' as message, 0 as amount, 'keluar' as type 
         FROM siswa_pengambilan_mbg 
         WHERE siswa_id = ?)
        ORDER BY created_at DESC LIMIT 20
    ");
    $stmtHistory->execute([$siswa_internal_id, $siswa_internal_id]);
    $riwayat = $stmtHistory->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => [
            "saldo" => (float) $siswa['saldo'],
            "poin" => rand(10, 100), // Dummy poin untuk estetika
            "absensi_hari_ini" => $sudah_ambil,
            "qr_code_token" => $siswa['qr_code_token'],
            "riwayat" => $riwayat
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
