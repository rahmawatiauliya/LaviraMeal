<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");

try {
    $db->exec("ALTER TABLE kantin ADD COLUMN IF NOT EXISTS status_sppg ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' AFTER kapasitas_porsi");
    $db->exec("ALTER TABLE kantin ADD COLUMN IF NOT EXISTS status_sekolah ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' AFTER status_sppg");
    
    // Set default is_aktif to 0 for new registrations
    $db->exec("ALTER TABLE kantin MODIFY COLUMN is_aktif TINYINT(1) NOT NULL DEFAULT 0");
    
    echo "Added dual verification columns (status_sppg, status_sekolah) to 'kantin' table.\n";
    echo "Success!";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
