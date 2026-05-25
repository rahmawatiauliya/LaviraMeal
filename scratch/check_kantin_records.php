<?php
include_once __DIR__ . '/../api/shared/config.php';
header("Content-Type: text/plain");

try {
    $stmt = $db->query("SELECT id, nama_kantin, pemilik, is_aktif, status_sekolah, status_sppg, sekolah_id FROM kantin");
    $canteens = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "=== Kantin Records ===\n";
    print_r($canteens);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
