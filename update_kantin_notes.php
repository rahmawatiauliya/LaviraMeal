<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");

try {
    $db->exec("ALTER TABLE kantin ADD COLUMN IF NOT EXISTS catatan_sppg TEXT AFTER status_sppg");
    $db->exec("ALTER TABLE kantin ADD COLUMN IF NOT EXISTS catatan_sekolah TEXT AFTER status_sekolah");
    
    echo "Added review columns (catatan_sppg, catatan_sekolah) to 'kantin' table.\n";
    echo "Success!";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
