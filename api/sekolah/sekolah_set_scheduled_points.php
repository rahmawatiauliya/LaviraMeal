<?php
include_once __DIR__ . '/../shared/config.php';

// Endpoint untuk menyimpan jadwal distribusi poin sekolah (untuk kelas atau guru)
// Payload: sekolah_id, type ('kelas'/'guru'), target_id (kelas_nama atau guru_id), monthly_amount, distribution_day

$data = json_decode(file_get_contents("php://input"), true);

$sekolah_id = $data['sekolah_id'] ?? null;
$type = $data['type'] ?? 'kelas';
$target_id = $data['target_id'] ?? null;
$amount = $data['monthly_amount'] ?? 0;
$day = $data['distribution_day'] ?? 1;

if (!$sekolah_id || !$target_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
    exit();
}

try {
    // 1. Pastikan tabel ada
    $db->exec("CREATE TABLE IF NOT EXISTS sekolah_poin_jadwal (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sekolah_id INT NOT NULL,
        target_type ENUM('kelas', 'guru') NOT NULL,
        target_identifier VARCHAR(50) NOT NULL,
        monthly_amount DECIMAL(15,2) DEFAULT 0,
        distribution_day INT DEFAULT 1,
        last_distributed DATETIME DEFAULT NULL,
        UNIQUE KEY unique_target (sekolah_id, target_type, target_identifier)
    )");

    // 2. Upsert Jadwal
    $query = "INSERT INTO sekolah_poin_jadwal (sekolah_id, target_type, target_identifier, monthly_amount, distribution_day) 
              VALUES (?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE monthly_amount = VALUES(monthly_amount), distribution_day = VALUES(distribution_day)";
    
    $stmt = $db->prepare($query);
    $stmt->execute([$sekolah_id, $type, $target_id, $amount, $day]);

    echo json_encode([
        "status" => "success", 
        "message" => "Jadwal distribusi untuk " . ($type === 'kelas' ? "Kelas " : "") . $target_id . " berhasil diperbarui"
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
