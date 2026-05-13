<?php
header("Content-Type: application/json");
include_once __DIR__ . '/../shared/config.php';

$sppg_id = isset($_GET['sppg_id']) ? $_GET['sppg_id'] : null;
$sekolah_id = isset($_GET['sekolah_id']) ? $_GET['sekolah_id'] : null;

if (!empty($sppg_id)) {
    try {
        $params = [$sppg_id];
        $query = "SELECT s.id, s.nama_sekolah, s.npsn, s.saldo, s.alamat, u.email,
                         COALESCE(
                            (SELECT nama FROM guru WHERE sekolah_id = s.id AND (mata_pelajaran LIKE '%Kepala%' OR nama LIKE '%Kepala%') LIMIT 1),
                            REPLACE(REPLACE(COALESCE(u.nama, 'Belum Diatur'), 'Admin ', ''), 'Admin', '')
                         ) as kepala_sekolah,
                         'Aktif' as status,
                         CASE 
                            WHEN s.nama_sekolah LIKE 'SD%' THEN 'SD'
                            WHEN s.nama_sekolah LIKE 'SMP%' THEN 'SMP'
                            WHEN s.nama_sekolah LIKE 'SMA%' THEN 'SMA'
                            WHEN s.nama_sekolah LIKE 'SMK%' THEN 'SMK'
                            ELSE s.jenjang
                         END as jenjang,
                         CASE 
                            WHEN s.nama_sekolah LIKE 'SDN%' OR s.nama_sekolah LIKE 'SMPN%' OR s.nama_sekolah LIKE 'SMAN%' THEN 'Negeri'
                            ELSE 'Swasta'
                         END as status_sekolah,
                         (SELECT COUNT(*) FROM siswa WHERE sekolah_id = s.id) as siswa,
                         (SELECT COUNT(DISTINCT kelas) FROM siswa WHERE sekolah_id = s.id) as jumlah_kelas,
                         (SELECT COUNT(*) FROM kantin WHERE sekolah_id = s.id) as jumlah_kantin,
                         COALESCE(sp.monthly_amount, 0) as monthly_amount,
                         COALESCE(sp.distribution_day, 1) as distribution_day,
                         sp.last_distributed
                  FROM sekolah s
                  LEFT JOIN users u ON s.user_id = u.id
                  LEFT JOIN scheduled_points sp ON s.id = sp.sekolah_id
                  WHERE s.sppg_id = ?";
        
        if (!empty($sekolah_id)) {
            $query .= " AND s.id = ?";
            $params[] = $sekolah_id;
        }

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        
        if (!empty($sekolah_id)) {
            $sekolah = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($sekolah) {
                // Hitung Realisasi Konsumsi (berdasarkan scan porsi siswa)
                $stmt_cons = $db->prepare("
                    SELECT COUNT(*) 
                    FROM konsumsi_siswa ks
                    JOIN siswa sw ON ks.siswa_id = sw.id
                    WHERE sw.sekolah_id = ? AND ks.waktu_scan >= DATE_FORMAT(NOW(), '%Y-%m-01')
                ");
                $stmt_cons->execute([$sekolah['id']]);
                $total_konsumsi = $stmt_cons->fetchColumn() ?: 0;
                
                $total_siswa = (int)$sekolah['siswa'] ?: 1;
                $days_elapsed = (int)date('d');
                // Estimasi target konsumsi: realisasi porsi vs (siswa * hari berlalu)
                $target_konsumsi = min(100, round(($total_konsumsi / ($total_siswa * $days_elapsed)) * 100));
                
                // Hitung Kepatuhan Gizi (berdasarkan rata-rata rating feedback kantin di sekolah tsb)
                $stmt_gizi = $db->prepare("
                    SELECT AVG(rating) 
                    FROM feedback_kantin f
                    JOIN kantin k ON f.kantin_id = k.id
                    WHERE k.sekolah_id = ?
                ");
                $stmt_gizi->execute([$sekolah['id']]);
                $avg_rating = $stmt_gizi->fetchColumn() ?: 4.0; 
                $kepatuhan_gizi = round(($avg_rating / 5) * 100);

                $sekolah['target_konsumsi'] = (int)$target_konsumsi;
                $sekolah['kepatuhan_gizi'] = (int)$kepatuhan_gizi;
            }
        } else {
            $sekolah = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode([
            "status" => "success",
            "data" => $sekolah
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
