<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");

try {
    echo "--- Users ---\n";
    $stmt = $db->query("SELECT id, nama, username, role, sekolah_id FROM users");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }

    echo "\n--- Sekolah ---\n";
    $stmt = $db->query("SELECT id, nama_sekolah FROM sekolah");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
