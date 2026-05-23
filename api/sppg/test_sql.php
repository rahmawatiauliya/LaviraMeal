<?php
include_once __DIR__ . '/../shared/config.php';
header('Content-Type: text/plain');

try {
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
    echo "Table created or already exists.\n";
    
    $query = "INSERT INTO scheduled_points (sekolah_id, monthly_amount, distribution_day) 
              VALUES ('test-sekolah-id', 100, 1) 
              ON DUPLICATE KEY UPDATE monthly_amount = 200, distribution_day = 2";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    echo "Insert successful.\n";
} catch (PDOException $e) {
    echo "SQL ERROR: " . $e->getMessage() . "\n";
}
?>
