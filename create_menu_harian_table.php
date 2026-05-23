<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");

try {
    $db->exec("CREATE TABLE IF NOT EXISTS `menu_harian` (
        `id` char(36) NOT NULL,
        `kantin_id` char(36) NOT NULL,
        `tanggal` date NOT NULL,
        `nama_menu` varchar(255) NOT NULL,
        `deskripsi` text DEFAULT NULL,
        `foto_menu` varchar(255) DEFAULT NULL,
        `feedback_sppg` text DEFAULT NULL,
        `feedback_sekolah` text DEFAULT NULL,
        `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
        `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (`id`),
        KEY `kantin_id` (`kantin_id`),
        CONSTRAINT `menu_harian_ibfk_1` FOREIGN KEY (`kantin_id`) REFERENCES `kantin` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;");

    echo "Created table 'menu_harian' for daily menu postings.\n";
    echo "Success!";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
