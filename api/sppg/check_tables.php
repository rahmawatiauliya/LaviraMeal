<?php
include_once __DIR__ . '/../shared/config.php';

header('Content-Type: text/plain');

$tables = ['scheduled_points', 'transaksi_dana', 'sekolah', 'sppg', 'point_distribution_logs'];

foreach ($tables as $table) {
    echo "=== TABLE: $table ===\n";
    try {
        $stmt = $db->query("SHOW CREATE TABLE `$table`");
        $row = $stmt->fetch(PDO::FETCH_NUM);
        echo $row[1] . "\n\n";
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n\n";
    }
}
?>
