<?php
include_once __DIR__ . '/api/shared/config.php';

echo "--- DATA GURU ---\n";
$stmt = $db->query("SELECT id, nama, jabatan, sekolah_id FROM guru LIMIT 5");
while($row = $stmt->fetch()) {
    echo "ID: {$row['id']} | Nama: {$row['nama']} | Jabatan: {$row['jabatan']} | Sekolah ID: {$row['sekolah_id']}\n";
}

echo "\n--- DATA SISWA COUNT ---\n";
$stmt = $db->query("SELECT sekolah_id, COUNT(*) as total FROM siswa GROUP BY sekolah_id");
while($row = $stmt->fetch()) {
    echo "Sekolah ID: {$row['sekolah_id']} | Total Siswa: {$row['total']}\n";
}

echo "\n--- SAMPLE SISWA ---\n";
$stmt = $db->query("SELECT id, nama, kelas, sekolah_id FROM siswa LIMIT 5");
while($row = $stmt->fetch()) {
    echo "ID: {$row['id']} | Nama: {$row['nama']} | Kelas: {$row['kelas']} | Sekolah ID: {$row['sekolah_id']}\n";
}
?>
