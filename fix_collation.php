<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");

try {
    // 1. Drop the problematic table if it exists
    $db->exec("DROP TABLE IF EXISTS sekolah_poin_jadwal");
    echo "Dropped table 'sekolah_poin_jadwal'.\n";

    // 2. Create it with correct collation and column types
    $sql = "CREATE TABLE `sekolah_poin_jadwal` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `sekolah_id` char(36) NOT NULL,
        `target_type` enum('kelas','guru') NOT NULL,
        `target_identifier` varchar(50) NOT NULL,
        `monthly_amount` decimal(15,2) DEFAULT 0.00,
        `distribution_day` int(11) DEFAULT 1,
        `last_distributed` datetime DEFAULT NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `unique_target` (`sekolah_id`,`target_type`,`target_identifier`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;";
    
    $db->exec($sql);
    echo "Created table 'sekolah_poin_jadwal' with utf8mb4_general_ci.\n";

    // 3. Ensure other tables also use general_ci if they were recreated recently
    $db->exec("ALTER TABLE scheduled_points CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
    echo "Ensured 'scheduled_points' uses utf8mb4_general_ci.\n";

    echo "\nFix applied successfully!";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
