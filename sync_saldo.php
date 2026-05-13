<?php
include_once __DIR__ . '/api/shared/config.php';
$db->query("UPDATE sekolah s JOIN (SELECT sekolah_id, SUM(nominal) as total FROM transaksi_dana GROUP BY sekolah_id) t ON s.id = t.sekolah_id SET s.saldo = t.total");
echo "Balances updated!";
?>
