<?php
include_once __DIR__ . '/../shared/config.php';
header('Content-Type: text/plain');

$sppg = $db->query("SELECT id, nama_lembaga FROM sppg LIMIT 1")->fetch();
$sppg_id = $sppg ? $sppg['id'] : null;

echo "SPPG ID: " . ($sppg_id ?: 'NULL') . "\n";
echo "SPPG NAME: " . ($sppg ? $sppg['nama_lembaga'] : 'NONE') . "\n\n";

if ($sppg_id) {
    // Check schools
    $sekolah = $db->query("SELECT id, nama_sekolah FROM sekolah")->fetchAll(PDO::FETCH_ASSOC);
    echo "=== REGISTERED SCHOOLS ===\n";
    print_r($sekolah);
    echo "\n";
    
    // Check SMAN 1 Klari
    $stmt_sman = $db->query("SELECT id, nama_sekolah, sppg_id FROM sekolah WHERE nama_sekolah LIKE '%SMAN 1 Klari%' LIMIT 1");
    $sman = $stmt_sman->fetch();
    echo "=== SMAN 1 KLARI FIND ===\n";
    print_r($sman);
    echo "\n";
    
    // Check transactions
    $stmt_trans = $db->query("SELECT * FROM transaksi_dana");
    $trans = $stmt_trans->fetchAll(PDO::FETCH_ASSOC);
    echo "=== TRANSAKSI DANA ===\n";
    print_r($trans);
    echo "\n";
    
    // Check stats SQL
    $stmt_point = $db->prepare("SELECT SUM(nominal) FROM transaksi_dana WHERE sppg_id = ? AND status IN ('Success', 'Berhasil')");
    $stmt_point->execute([$sppg_id]);
    $point = $stmt_point->fetchColumn() ?: 0;
    echo "=== CALCULATED POINT FOR SPPG ID: $sppg_id ===\n";
    echo "POINT: $point\n";
}
?>
