<?php
include_once __DIR__ . '/config.php';
$stmt = $db->prepare("SELECT s.nama, s.saldo, u.username FROM siswa s JOIN users u ON s.user_id = u.id WHERE s.kelas = '10-IPA-1'");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
