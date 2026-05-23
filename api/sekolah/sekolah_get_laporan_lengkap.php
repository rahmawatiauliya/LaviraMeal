<?php
include_once __DIR__ . '/../shared/config.php';

$sekolah_id = isset($_GET['sekolah_id']) ? $_GET['sekolah_id'] : null;

if (!$sekolah_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Sekolah ID required"]);
    exit();
}

try {
    // 1. Riwayat Distribusi
    $query_riwayat = "
        SELECT 
            jd.id,
            jd.tanggal,
            jd.sesi,
            jd.kuota_porsi as jumlah_makan,
            k.nama_kantin,
            jd.status,
            f.petugas_penerima
        FROM jadwal_distribusi jd
        JOIN kantin k ON jd.kantin_id = k.id
        LEFT JOIN feedback_kantin f ON jd.id = f.jadwal_id
        WHERE jd.sekolah_id = ?
        ORDER BY jd.tanggal DESC
        LIMIT 50
    ";
    $stmt_riwayat = $db->prepare($query_riwayat);
    $stmt_riwayat->execute([$sekolah_id]);
    $riwayat = $stmt_riwayat->fetchAll(PDO::FETCH_ASSOC);

    // 2. Transaksi Dana (Masuk dari SPPG)
    $query_transaksi = "
        SELECT 
            td.id,
            DATE_FORMAT(td.tanggal, '%d %b %Y') as tanggal_format,
            td.tanggal,
            td.nominal,
            td.metode,
            td.status,
            'masuk' as arah,
            'SPPG Payment' as pengirim
        FROM transaksi_dana td
        WHERE td.sekolah_id = ?
        ORDER BY td.tanggal DESC
        LIMIT 50
    ";
    $stmt_transaksi = $db->prepare($query_transaksi);
    $stmt_transaksi->execute([$sekolah_id]);
    $transaksi_masuk = $stmt_transaksi->fetchAll(PDO::FETCH_ASSOC);

    // 2.5 Transaksi Dana Keluar (dari activity_logs)
    $query_keluar = "
        SELECT 
            id,
            DATE_FORMAT(created_at, '%d %b %Y') as tanggal_format,
            created_at as tanggal,
            message as metode,
            detail,
            'Berhasil' as status,
            'keluar' as arah
        FROM activity_logs
        WHERE sekolah_id = ? AND type IN ('DISTRIBUSI_POIN', 'TRANSFER_INDIVIDU', 'TRANSFER_KELAS')
        ORDER BY created_at DESC
        LIMIT 50
    ";
    $stmt_keluar = $db->prepare($query_keluar);
    $stmt_keluar->execute([$sekolah_id]);
    $transaksi_keluar_raw = $stmt_keluar->fetchAll(PDO::FETCH_ASSOC);

    $transaksi_keluar = [];
    foreach ($transaksi_keluar_raw as $log) {
        $nominal = 0;
        $pengirim = "Siswa/Guru";
        // Extract amount from detail using regex
        if (preg_match('/(?:sebesar|Transfer)\s*([0-9\.]+)\s*PTS/i', $log['detail'], $matches)) {
            $nominal = (float)$matches[1];
        } elseif (preg_match('/total\s*(?:Rp|PTS)?\s*([0-9\.]+)/i', $log['detail'], $matches)) {
            $nominal = (float)$matches[1];
        }
        
        // Try to find the target from detail
        if (preg_match('/ke\s+([a-zA-Z0-9_ -]+?)(?:\s*sebesar|\s*:|\s*\.)/i', $log['detail'], $matches)) {
            $pengirim = trim($matches[1]);
        }

        $transaksi_keluar[] = [
            'id' => "OUT-" . $log['id'],
            'tanggal_format' => $log['tanggal_format'],
            'tanggal' => $log['tanggal'],
            'nominal' => $nominal,
            'metode' => $log['metode'],
            'status' => $log['status'],
            'arah' => $log['arah'],
            'pengirim' => "Ke: " . $pengirim,
            'detail' => $log['detail']
        ];
    }

    // Merge and sort
    $transaksi_dana = array_merge($transaksi_masuk, $transaksi_keluar);
    usort($transaksi_dana, function($a, $b) {
        return strtotime($b['tanggal']) - strtotime($a['tanggal']);
    });
    // Limit to 50 combined
    $transaksi_dana = array_slice($transaksi_dana, 0, 50);

    // 3. Penerima Dana per Kelas (Summary Dana Kaget per Kelas)
    $query_penerima = "
        SELECT 
            s.kelas,
            COUNT(dkc.id) as jumlah_siswa,
            SUM(dk.amount) as total_dana,
            DATE_FORMAT(dkc.claimed_at, '%M %Y') as periode
        FROM dana_kaget_claims dkc
        JOIN siswa s ON dkc.user_id = s.user_id
        JOIN dana_kaget dk ON dkc.dana_kaget_id = dk.id
        WHERE dk.sekolah_id = ?
        GROUP BY s.kelas, DATE_FORMAT(dkc.claimed_at, '%Y-%m')
        ORDER BY dkc.claimed_at DESC
    ";
    $stmt_penerima = $db->prepare($query_penerima);
    $stmt_penerima->execute([$sekolah_id]);
    $penerima_kelas = $stmt_penerima->fetchAll(PDO::FETCH_ASSOC);

    // 4. Rekap Bulanan
    $query_bulanan = "
        SELECT 
            DATE_FORMAT(td.tanggal, '%M %Y') as bulan,
            SUM(CASE WHEN td.status IN ('Berhasil', 'Success') THEN td.nominal ELSE 0 END) as total_dana_masuk,
            (
                SELECT SUM(dk.amount)
                FROM dana_kaget_claims dkc
                JOIN dana_kaget dk ON dkc.dana_kaget_id = dk.id
                WHERE dk.sekolah_id = ? 
                AND DATE_FORMAT(dkc.claimed_at, '%M %Y') = DATE_FORMAT(td.tanggal, '%M %Y')
            ) as total_dana_keluar,
            (
                SELECT COUNT(*) 
                FROM dana_kaget_claims dkc
                JOIN dana_kaget dk ON dkc.dana_kaget_id = dk.id
                WHERE dk.sekolah_id = ? 
                AND DATE_FORMAT(dkc.claimed_at, '%M %Y') = DATE_FORMAT(td.tanggal, '%M %Y')
            ) as total_penerima,
            SUM(CASE WHEN td.status IN ('Berhasil', 'Success') THEN 1 ELSE 0 END) as transaksi_masuk
        FROM transaksi_dana td
        WHERE td.sekolah_id = ?
        GROUP BY DATE_FORMAT(td.tanggal, '%Y-%m')
        ORDER BY td.tanggal DESC
    ";
    $stmt_bulanan = $db->prepare($query_bulanan);
    $stmt_bulanan->execute([$sekolah_id, $sekolah_id, $sekolah_id]);
    $bulanan = $stmt_bulanan->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => [
            "riwayat" => $riwayat,
            "transaksi_dana" => $transaksi_dana,
            "penerima_kelas" => $penerima_kelas,
            "bulanan" => $bulanan
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
