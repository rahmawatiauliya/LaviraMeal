<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");

try {
    $db->exec("ALTER TABLE `transaksi_siswa` ADD COLUMN `kantin_id` char(36) DEFAULT NULL AFTER `siswa_id` ");
    echo "Added 'kantin_id' column to 'transaksi_siswa' table.\n";
    echo "Success!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
