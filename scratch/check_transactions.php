<?php
include_once __DIR__ . '/../api/shared/config.php';
header("Content-Type: text/plain");

function dumpTable($db, $table) {
    echo "=== $table ===\n";
    try {
        $stmt = $db->query("SELECT * FROM `$table` ORDER BY created_at DESC LIMIT 5");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            print_r($row);
        }
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
    echo "\n";
}

dumpTable($db, 'transaksi_siswa');
dumpTable($db, 'transaksi_guru');
?>
