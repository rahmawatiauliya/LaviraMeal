<?php
include_once __DIR__ . '/api/shared/config.php';
try {
    $db->query("ALTER TABLE sppg ADD COLUMN saldo decimal(15,2) DEFAULT 75250000.00");
    echo "Column saldo added to sppg table!";
} catch (Exception $e) {
    echo "Error or column already exists: " . $e->getMessage();
}
?>
