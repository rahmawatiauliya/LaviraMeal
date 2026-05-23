<?php
include_once __DIR__ . '/../api/shared/config.php';
header("Content-Type: text/plain");

try {
    echo "--- sekolah_poin_jadwal ---\n";
    $stmt = $db->query("SELECT * FROM sekolah_poin_jadwal");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }

    echo "\n--- sekolah ---\n";
    $stmt = $db->query("SELECT id, nama_sekolah, saldo FROM sekolah");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }

    echo "\n--- siswa (SMPN 2 Klari, 7-A) ---\n";
    $stmt = $db->query("SELECT id, nama, kelas, is_active, saldo FROM siswa WHERE kelas='7-A'");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
