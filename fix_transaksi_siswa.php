<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");

try {
    $sql = "CREATE TABLE IF NOT EXISTS `transaksi_siswa` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `siswa_id` char(36) NOT NULL,
        `type` enum('masuk','keluar') NOT NULL,
        `category` varchar(50) DEFAULT 'Transfer',
        `nominal` decimal(15,2) NOT NULL DEFAULT 0.00,
        `message` text DEFAULT NULL,
        `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (`id`),
        KEY `siswa_id` (`siswa_id`),
        CONSTRAINT `transaksi_siswa_ibfk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;";

    $db->exec($sql);
    echo "Table 'transaksi_siswa' created successfully!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
