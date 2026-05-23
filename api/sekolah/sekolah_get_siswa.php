<?php
include_once __DIR__ . '/../shared/config.php';

$sekolah_id = isset($_GET['sekolah_id']) ? $_GET['sekolah_id'] : null;
$nama_kelas = isset($_GET['kelas']) ? $_GET['kelas'] : null;

if (!$sekolah_id || !$nama_kelas) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Sekolah ID dan Nama Kelas diperlukan"]);
    exit();
}

try {
    // Ambil semua siswa di sekolah ini yang berada di kelas tertentu
    $query = "
        SELECT s.id, s.nama, s.nis, s.jenis_kelamin, s.is_active as aktif, g.nama as nama_guru
        FROM siswa s
        LEFT JOIN guru g ON s.guru_id = g.id
        WHERE s.sekolah_id = ? AND s.kelas = ? 
        ORDER BY s.nama ASC
    ";
    $stmt = $db->prepare($query);
    $stmt->execute([$sekolah_id, $nama_kelas]);
    $siswa = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $siswa
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
