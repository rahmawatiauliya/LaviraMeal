<?php
include_once __DIR__ . '/api/shared/config.php';
$output = "";
$tables = ['users', 'kantin', 'transaksi_siswa', 'feedback_kantin', 'sekolah'];
foreach ($tables as $table) {
    $output .= "--- $table ---\n";
    try {
        $q = $db->query("DESCRIBE $table");
        while($r = $q->fetch(PDO::FETCH_ASSOC)) {
            $output .= $r['Field'] . " (" . $r['Type'] . ")\n";
        }
    } catch (Exception $e) {
        $output .= "Error: " . $e->getMessage() . "\n";
    }
    $output .= "\n";
}
file_put_contents('schema_result.txt', $output);
?>
