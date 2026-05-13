<?php
include_once __DIR__ . '/../shared/config.php';

header("Content-Type: application/json");

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "User ID required"]);
    exit();
}

try {
    // 1. Get Guru Info
    $stmt = $db->prepare("SELECT sekolah_id FROM guru WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $guru = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$guru) {
        echo json_encode(["status" => "error", "message" => "Guru data not found"]);
        exit();
    }

    $sekolah_id = $guru['sekolah_id'];

    // 2. Get Distribution Schedules for the school
    // We show schedules for current month
    $stmtJadwal = $db->prepare("SELECT j.*, k.nama_kantin 
                                FROM jadwal_distribusi j 
                                JOIN kantin k ON j.kantin_id = k.id 
                                WHERE j.sekolah_id = ? AND j.tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                                ORDER BY j.tanggal DESC, j.sesi ASC");
    $stmtJadwal->execute([$sekolah_id]);
    $jadwal = $stmtJadwal->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $jadwal
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
