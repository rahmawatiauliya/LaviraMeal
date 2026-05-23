<?php
include_once __DIR__ . '/api/shared/config.php';
$sekolah_id = '6dcc628d-0a47-499e-ac02-71f306d852a3';

try {
    $query = "
        SELECT s.kelas, COUNT(s.id) as jumlah_siswa, 
               MAX(j.monthly_amount) as monthly_amount, 
               MAX(j.distribution_day) as distribution_day, 
               MAX(j.last_distributed) as last_distributed
        FROM siswa s
        LEFT JOIN sekolah_poin_jadwal j ON s.sekolah_id = j.sekolah_id AND j.target_type = 'kelas' AND j.target_identifier = s.kelas
        WHERE s.sekolah_id = ? 
        GROUP BY s.kelas 
        ORDER BY s.kelas ASC
    ";
    $stmt = $db->prepare($query);
    $stmt->execute([$sekolah_id]);
    $list_kelas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    print_r($list_kelas);
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
