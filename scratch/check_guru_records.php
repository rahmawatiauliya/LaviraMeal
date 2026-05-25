<?php
include_once __DIR__ . '/../api/shared/config.php';
header("Content-Type: text/plain");

try {
    $stmt = $db->query("SELECT id, user_id, nama, sekolah_id FROM guru");
    $guru = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "=== Guru Records ===\n";
    print_r($guru);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
