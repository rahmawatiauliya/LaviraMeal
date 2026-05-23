<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");

try {
    $sql = "CREATE TABLE IF NOT EXISTS `scheduled_points` (
        `sekolah_id` char(36) NOT NULL,
        `monthly_amount` decimal(15,2) DEFAULT 0.00,
        `distribution_day` int(11) DEFAULT 1,
        `last_distributed` date DEFAULT NULL,
        `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
        `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (`sekolah_id`),
        CONSTRAINT `scheduled_points_ibfk_1` FOREIGN KEY (`sekolah_id`) REFERENCES `sekolah` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;";

    $db->exec($sql);
    echo "Table 'scheduled_points' created successfully!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
