<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");

try {
    echo "--- Users ---\n";
    $stmt = $db->query("SELECT id, username, sppg_id FROM users WHERE role = 'sppg'");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }

    echo "\n--- Sekolah ---\n";
    $stmt = $db->query("SELECT id, nama_sekolah, sppg_id FROM sekolah");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
