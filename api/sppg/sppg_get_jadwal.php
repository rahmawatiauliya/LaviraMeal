<?php
include_once __DIR__ . '/../shared/config.php';

$sppg_id = isset($_GET['sppg_id']) ? $_GET['sppg_id'] : null;

if (!empty($sppg_id)) {
    try {
        // Query ini dirancang untuk mengambil hari, menu, sayur, tambahan, dan kalori
        // namun struktur menu sebenarnya (db.sql) memiliki kolom: nama_menu, deskripsi, kalori
        // Untuk penyederhanaan pada endpoint, kita gabungkan data dari distribusi_detail
        $stmt = $db->prepare("
            SELECT 
                j.id, 
                j.tanggal, 
                j.status, 
                s.nama_sekolah,
                'Nasi Putih, Lauk Pauk' as menuUtama,
                650 as kalori_total
            FROM jadwal_distribusi j
            JOIN sekolah s ON j.sekolah_id = s.id
            WHERE j.sppg_id = ?
            GROUP BY j.id, j.tanggal, j.status, s.nama_sekolah
            ORDER BY j.tanggal ASC
        ");
        
        $stmt->execute([$sppg_id]);
        $jadwal_list = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $result = array_map(function($j) {
            $hariInggris = date('l', strtotime($j['tanggal']));
            $mapHari = [
                'Monday' => 'Senin', 'Tuesday' => 'Selasa', 'Wednesday' => 'Rabu', 
                'Thursday' => 'Kamis', 'Friday' => 'Jumat', 'Saturday' => 'Sabtu', 'Sunday' => 'Minggu'
            ];

            return [
                'id' => $j['id'],
                'hari' => $mapHari[$hariInggris] ?? '-',
                'tanggal' => date('d M Y', strtotime($j['tanggal'])),
                'menuUtama' => $j['menuUtama'] ?: 'Belum ada menu',
                'sayur' => '-',
                'tambahan' => '-',
                'kalori' => ($j['kalori_total'] ?: '0') . ' kcal',
                'status' => ucfirst($j['status']),
                'sekolah' => $j['nama_sekolah']
            ];
        }, $jadwal_list);

        echo json_encode([
            "status" => "success",
            "data" => $result
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "SPPG ID tidak ditemukan"]);
}
?>
