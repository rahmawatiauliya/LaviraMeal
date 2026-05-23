<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");

try {
    echo "--- Database Tables ---\n";
    $tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    print_r($tables);

    echo "\n--- Checking feedback_kantin ---\n";
    if (in_array('feedback_kantin', $tables)) {
        echo "Table 'feedback_kantin' exists!\n";
        $columns = $db->query("DESCRIBE feedback_kantin")->fetchAll(PDO::FETCH_ASSOC);
        print_r($columns);
    } else {
        echo "Table 'feedback_kantin' is MISSING! Creating it...\n";
        $db->exec("CREATE TABLE `feedback_kantin` (
            `id` char(36) NOT NULL,
            `user_id` char(36) NOT NULL,
            `kantin_id` char(36) NOT NULL,
            `rating` tinyint(1) NOT NULL,
            `komentar` text DEFAULT NULL,
            `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
            PRIMARY KEY (`id`),
            KEY `kantin_id` (`kantin_id`),
            KEY `user_id` (`user_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;");
        echo "Table 'feedback_kantin' created successfully!\n";
    }

    echo "\n--- Checking transaksi_siswa ---\n";
    if (in_array('transaksi_siswa', $tables)) {
        echo "Table 'transaksi_siswa' exists!\n";
        $columns = $db->query("DESCRIBE transaksi_siswa")->fetchAll(PDO::FETCH_ASSOC);
        print_r($columns);
    } else {
        echo "Table 'transaksi_siswa' is MISSING!\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
