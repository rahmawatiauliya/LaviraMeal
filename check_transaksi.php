<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");

echo "=== DESCRIBE TABLE ===\n";
$stmt = $db->query("DESCRIBE transaksi_dana");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    print_r($row);
}
?>
