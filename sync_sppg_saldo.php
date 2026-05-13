<?php
include_once __DIR__ . '/api/shared/config.php';
$db->query("UPDATE sppg s JOIN (SELECT sppg_id, SUM(nominal) as total FROM transaksi_dana GROUP BY sppg_id) t ON s.id = t.sppg_id SET s.saldo = 75250000.00 - t.total");
echo "SPPG balances synced based on history!";
?>
