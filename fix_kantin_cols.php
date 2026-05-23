<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");

try {
    // Add missing columns to kantin table
    $db->exec("ALTER TABLE kantin ADD COLUMN IF NOT EXISTS foto_kantin VARCHAR(255) AFTER pemilik");
    $db->exec("ALTER TABLE kantin ADD COLUMN IF NOT EXISTS foto_menu VARCHAR(255) AFTER foto_kantin");
    $db->exec("ALTER TABLE kantin ADD COLUMN IF NOT EXISTS npsn_sekolah VARCHAR(50) AFTER foto_menu");
    
    // Ensure is_aktif is 0 by default
    $db->exec("ALTER TABLE kantin MODIFY COLUMN is_aktif TINYINT(1) NOT NULL DEFAULT 0");
    
    echo "Added missing columns (foto_kantin, foto_menu, npsn_sekolah) to 'kantin' table.\n";
    echo "Success!";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
