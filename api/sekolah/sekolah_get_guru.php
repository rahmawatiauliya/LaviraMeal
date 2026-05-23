<?php
include_once __DIR__ . '/../shared/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$sekolah_id = isset($_GET['sekolah_id']) ? $_GET['sekolah_id'] : '';

if (!$sekolah_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Sekolah ID is required"]);
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

    $query = "SELECT g.*, u.email, u.is_active, j.monthly_amount, j.distribution_day, j.last_distributed
              FROM guru g
              JOIN users u ON g.user_id = u.id
              LEFT JOIN sekolah_poin_jadwal j ON g.sekolah_id = j.sekolah_id AND j.target_type = 'guru' AND j.target_identifier = g.id
              WHERE g.sekolah_id = ?
              ORDER BY g.nama ASC";
    
    $stmt = $db->prepare($query);
    $stmt->execute([$sekolah_id]);
    $gurus = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $gurus
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
