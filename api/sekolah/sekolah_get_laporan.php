<?php
include_once __DIR__ . '/../shared/config.php';

$sekolah_id = isset($_GET['sekolah_id']) ? $_GET['sekolah_id'] : null;

if (!$sekolah_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Sekolah ID diperlukan"]);
    exit();
}

try {
    // Ambil riwayat distribusi untuk sekolah ini
    $query = "
        SELECT 
            jd.id,
            jd.tanggal,
            jd.sesi,
            jd.kuota_porsi,
            k.nama_kantin,
            jd.status,
            f.petugas_penerima,
            f.rating,
            f.komentar
        FROM jadwal_distribusi jd
        JOIN kantin k ON jd.kantin_id = k.id
        LEFT JOIN feedback_kantin f ON jd.id = f.jadwal_id
        WHERE jd.sekolah_id = ?
        ORDER BY jd.tanggal DESC
    ";
    $stmt = $db->prepare($query);
    $stmt->execute([$sekolah_id]);
    $riwayat = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $riwayat
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
