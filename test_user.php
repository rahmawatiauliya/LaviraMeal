<?php
include_once __DIR__ . '/api/shared/config.php';
$stmt = $db->query("SELECT id, nama, role, sppg_id FROM users");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "USERS:\n"; print_r($users);

$stmt2 = $db->query("SELECT id, user_id, nama_lembaga FROM sppg");
$sppg = $stmt2->fetchAll(PDO::FETCH_ASSOC);
echo "\nSPPG:\n"; print_r($sppg);

$stmt3 = $db->query("SELECT id, sppg_id, nama_sekolah FROM sekolah");
$sekolah = $stmt3->fetchAll(PDO::FETCH_ASSOC);
echo "\nSEKOLAH:\n"; print_r($sekolah);
?>
