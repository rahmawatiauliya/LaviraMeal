<?php
include_once __DIR__ . '/api/shared/config.php';
$tables = ['users', 'kantin', 'transaksi_siswa', 'feedback_kantin', 'sekolah', 'sppg'];
foreach ($tables as $table) {
    echo "--- $table ---\n";
    try {
        $q = $db->query("DESCRIBE $table");
        while($r = $q->fetch(PDO::FETCH_ASSOC)) {
            echo $r['Field'] . " (" . $r['Type'] . ")\n";
        }
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
    echo "\n";
}
?>
