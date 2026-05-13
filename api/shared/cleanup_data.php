<?php
require_once 'config.php';

// 1. Hapus data yang persis "Nama Lengkap" dan "Kelas" (Header Excel)
$stmt = $db->prepare("DELETE FROM siswa WHERE nama = 'Nama Lengkap' AND kelas = 'Kelas'");
$stmt->execute();
$count1 = $stmt->rowCount();

// 2. Hapus data yang kelasnya "Lainnya" (Jika ada sisa)
$stmt2 = $db->prepare("DELETE FROM siswa WHERE kelas = 'Lainnya'");
$stmt2->execute();
$count2 = $stmt2->rowCount();

// 3. Update jumlah siswa di tabel sekolah
$db->query("UPDATE sekolah s SET s.jumlah_siswa = (SELECT COUNT(*) FROM siswa sw WHERE sw.sekolah_id = s.id)");

echo "Pembersihan Selesai!\n";
echo "- Data Header Dihapus: $count1\n";
echo "- Data 'Lainnya' Dihapus: $count2\n";
?>
