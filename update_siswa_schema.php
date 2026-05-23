<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");

try {
    $db->exec("ALTER TABLE siswa ADD COLUMN IF NOT EXISTS jenis_kelamin ENUM('L','P') AFTER nama");
    $db->exec("ALTER TABLE siswa ADD COLUMN IF NOT EXISTS tanggal_lahir DATE AFTER jenis_kelamin");
    $db->exec("ALTER TABLE siswa ADD COLUMN IF NOT EXISTS nama_wali VARCHAR(200) AFTER tanggal_lahir");
    $db->exec("ALTER TABLE siswa ADD COLUMN IF NOT EXISTS no_telp_wali VARCHAR(20) AFTER nama_wali");
    
    echo "Added missing columns (jenis_kelamin, tanggal_lahir, nama_wali, no_telp_wali) to 'siswa' table.\n";
    echo "Success!";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
