<?php
include_once __DIR__ . '/../shared/config.php';

header("Content-Type: application/json");

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
$filter = isset($_GET['filter']) ? $_GET['filter'] : 'mingguan'; // mingguan, bulanan

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "User ID required"]);
    exit();
}

try {
    // 1. Get Guru & Kelas Info
    $stmt = $db->prepare("SELECT id, sekolah_id, kelas_wali FROM guru WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $guru = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$guru) {
        echo json_encode(["status" => "error", "message" => "Guru data not found"]);
        exit();
    }

    $sekolah_id = $guru['sekolah_id'];
    $kelas_wali = $guru['kelas_wali'];

    // 2. Fetch Consumption Stats based on filter
    $date_limit = $filter === 'bulanan' ? "DATE_SUB(CURDATE(), INTERVAL 30 DAY)" : "DATE_SUB(CURDATE(), INTERVAL 7 DAY)";

    $query = "
        SELECT 
            s.nama, 
            s.nis,
            COUNT(ks.id) as total_jadwal,
            SUM(ks.hadir) as total_hadir,
            SUM(ks.makan) as total_makan
        FROM siswa s
        LEFT JOIN konsumsi_siswa ks ON s.id = ks.siswa_id
        LEFT JOIN jadwal_distribusi jd ON ks.jadwal_id = jd.id
        WHERE s.sekolah_id = ? AND s.kelas = ? AND (jd.tanggal >= $date_limit OR ks.id IS NULL)
        GROUP BY s.id
        ORDER BY s.nama ASC
    ";

    $stmtRekap = $db->prepare($query);
    $stmtRekap->execute([$sekolah_id, $kelas_wali]);
    $rekap = $stmtRekap->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $rekap
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
