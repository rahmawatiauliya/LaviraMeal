<?php
include_once __DIR__ . '/config.php';
header("Content-Type: text/plain");

echo "Updating database schema for Monitoring Menu feature...\n";

try {
    // 1. Update menu_kantin table
    $columns = $db->query("DESCRIBE menu_kantin")->fetchAll(PDO::FETCH_COLUMN);
    
    if (!in_array('kantin_id', $columns)) {
        echo "Adding 'kantin_id' to 'menu_kantin'...\n";
        $db->exec("ALTER TABLE menu_kantin ADD COLUMN kantin_id char(36) DEFAULT NULL AFTER sekolah_id");
        $db->exec("ALTER TABLE menu_kantin ADD CONSTRAINT menu_kantin_ibfk_2 FOREIGN KEY (kantin_id) REFERENCES kantin(id) ON DELETE SET NULL");
    }

    if (!in_array('jam_mulai', $columns)) {
        echo "Adding 'jam_mulai' and 'jam_selesai' to 'menu_kantin'...\n";
        $db->exec("ALTER TABLE menu_kantin ADD COLUMN jam_mulai time DEFAULT '07:00:00'");
        $db->exec("ALTER TABLE menu_kantin ADD COLUMN jam_selesai time DEFAULT '14:00:00'");
    }

    // 2. Create menu_kantin_komentar table
    $tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('menu_kantin_komentar', $tables)) {
        echo "Creating 'menu_kantin_komentar' table...\n";
        $db->exec("CREATE TABLE `menu_kantin_komentar` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `menu_kantin_id` int(11) NOT NULL,
          `admin_id` char(36) NOT NULL,
          `komentar` text NOT NULL,
          `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
          PRIMARY KEY (`id`),
          KEY `menu_kantin_id` (`menu_kantin_id`),
          KEY `admin_id` (`admin_id`),
          CONSTRAINT `menu_kantin_komentar_ibfk_1` FOREIGN KEY (`menu_kantin_id`) REFERENCES `menu_kantin` (`id`) ON DELETE CASCADE,
          CONSTRAINT `menu_kantin_komentar_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;");
    }

    echo "\nDatabase update completed successfully.\n";

} catch (Exception $e) {
    echo "Error updating database: " . $e->getMessage() . "\n";
}
?>
