<?php
include_once __DIR__ . '/../shared/config.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['sekolah_id']) || !isset($data['monthly_amount']) || !isset($data['distribution_day'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Sekolah ID, nominal bulanan, dan tanggal distribusi wajib diisi.']);
    exit();
}

try {
    // Pastikan tabel scheduled_points ada
    $db->exec("CREATE TABLE IF NOT EXISTS scheduled_points (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sekolah_id CHAR(36) NOT NULL,
        monthly_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        distribution_day INT NOT NULL DEFAULT 1,
        last_distributed DATE DEFAULT NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_sekolah (sekolah_id)
    )");

    try {
        $db->exec("ALTER TABLE scheduled_points ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active'");
    } catch (Exception $e) { }

    try {
        $db->exec("ALTER TABLE scheduled_points ADD CONSTRAINT unique_sekolah UNIQUE (sekolah_id)");
    } catch (Exception $e) { }

    $query = "INSERT INTO scheduled_points (sekolah_id, monthly_amount, distribution_day) 
              VALUES (:sid, :amt, :day) 
              ON DUPLICATE KEY UPDATE monthly_amount = :amt2, distribution_day = :day2";
              
    $stmt = $db->prepare($query);
    $stmt->execute([
        ':sid' => $data['sekolah_id'],
        ':amt' => $data['monthly_amount'],
        ':day' => $data['distribution_day'],
        ':amt2' => $data['monthly_amount'],
        ':day2' => $data['distribution_day']
    ]);

    echo json_encode([
        'status' => 'success', 
        'message' => 'Jadwal poin bulanan berhasil diperbarui.',
        'sekolah_id' => $data['sekolah_id'],
        'monthly_amount' => $data['monthly_amount']
    ]);
} catch (PDOException $e) {
    http_response_code(200);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
