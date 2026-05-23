<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");

try {
    $db->exec("CREATE TABLE IF NOT EXISTS `notifications` (
        `id` char(36) NOT NULL,
        `user_id` char(36) DEFAULT NULL,
        `role` varchar(20) DEFAULT NULL,
        `sekolah_id` char(36) DEFAULT NULL,
        `title` varchar(255) NOT NULL,
        `message` text NOT NULL,
        `type` varchar(50) DEFAULT NULL,
        `is_read` tinyint(1) DEFAULT 0,
        `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;");

    echo "Created table 'notifications'.\n";
    echo "Success!";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
