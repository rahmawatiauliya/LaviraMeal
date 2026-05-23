<?php
include_once __DIR__ . '/../shared/config.php';

// Ambil sekolah_id dari params atau session
$sekolah_id = isset($_GET['sekolah_id']) ? $_GET['sekolah_id'] : null;

if (!$sekolah_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Sekolah ID diperlukan"]);
    exit();
}

try {
    // Pastikan tabel ada agar join tidak error pada instalasi baru
    try {
        $db->query("SELECT 1 FROM sekolah_poin_jadwal LIMIT 1");
    } catch (Exception $e) {
        $db->exec("CREATE TABLE sekolah_poin_jadwal (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sekolah_id CHAR(36) NOT NULL,
            target_type ENUM('kelas', 'guru') NOT NULL,
            target_identifier VARCHAR(50) NOT NULL,
            monthly_amount DECIMAL(15,2) DEFAULT 0,
            distribution_day INT DEFAULT 1,
            last_distributed DATETIME DEFAULT NULL,
            UNIQUE KEY unique_target (sekolah_id, target_type, target_identifier)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
    }

    $query = "
        SELECT s.kelas, COUNT(s.id) as jumlah_siswa, 
               MAX(j.monthly_amount) as monthly_amount, 
               MAX(j.distribution_day) as distribution_day, 
               MAX(j.last_distributed) as last_distributed
        FROM siswa s
        LEFT JOIN sekolah_poin_jadwal j ON s.sekolah_id = j.sekolah_id AND j.target_type = 'kelas' AND j.target_identifier = s.kelas
        WHERE s.sekolah_id = ? 
        GROUP BY s.kelas 
        ORDER BY s.kelas ASC
    ";
    $stmt = $db->prepare($query);
    $stmt->execute([$sekolah_id]);
    $list_kelas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Ensure numeric types
    foreach($list_kelas as &$k) {
        $k['id'] = $k['kelas']; // Use kelas name as ID for frontend
    }

    echo json_encode([
        "status" => "success",
        "data" => $list_kelas
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
