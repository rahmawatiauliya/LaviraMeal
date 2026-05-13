<?php
include_once __DIR__ . '/shared/config.php';

try {
    // Add wilayah column to sppg table if it doesn't exist
    $db->exec("ALTER TABLE sppg ADD COLUMN IF NOT EXISTS wilayah VARCHAR(100) AFTER nama_lembaga");
    // Add nik column to sppg table if it doesn't exist
    $db->exec("ALTER TABLE sppg ADD COLUMN IF NOT EXISTS nik VARCHAR(20) AFTER user_id");
    echo "Successfully updated sppg table schema.\n";
} catch (Exception $e) {
    echo "Error updating schema: " . $e->getMessage() . "\n";
}
?>
