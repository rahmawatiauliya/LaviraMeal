<?php
require_once 'config.php';
$stmt = $db->query("SELECT id, nama, kelas FROM siswa WHERE kelas NOT REGEXP '^[0-9]'");
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "DATA LAINNYA:\n";
foreach($results as $row) {
    echo "ID: {$row['id']} | Nama: {$row['nama']} | Kelas: {$row['kelas']}\n";
}
?>
