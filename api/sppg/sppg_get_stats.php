<?php
include_once __DIR__ . '/../shared/config.php';

$sppg_id = isset($_GET['sppg_id']) ? $_GET['sppg_id'] : null;

if (!empty($sppg_id)) {
    try {
        $start_date_filter = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-01');
        $end_date_filter = isset($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-d');

        // Total sekolah (Lifetime)
        $stmt_sekolah = $db->prepare("SELECT COUNT(*) as total FROM sekolah WHERE sppg_id = ?");
        $stmt_sekolah->execute([$sppg_id]);
        $total_sekolah = $stmt_sekolah->fetchColumn() ?: 0;

        // Daftar sekolah
        $stmt_daftar = $db->prepare("SELECT id, nama_sekolah as nama, alamat, jumlah_siswa FROM sekolah WHERE sppg_id = ?");
        $stmt_daftar->execute([$sppg_id]);
        $daftar_sekolah = $stmt_daftar->fetchAll(PDO::FETCH_ASSOC);

        // Kehadiran Sesuai Filter
        $stmt_kehadiran = $db->prepare("
            SELECT COUNT(*) as total 
            FROM konsumsi_siswa ks 
            JOIN siswa sw ON ks.siswa_id = sw.id
            JOIN sekolah s ON sw.sekolah_id = s.id 
            WHERE s.sppg_id = ? AND DATE(ks.waktu_scan) BETWEEN ? AND ?
        ");
        $stmt_kehadiran->execute([$sppg_id, $start_date_filter, $end_date_filter]);
        $kehadiran_hari_ini = $stmt_kehadiran->fetchColumn() ?: 0;

        // Total siswa
        $stmt_siswa = $db->prepare("SELECT SUM(jumlah_siswa) as total_siswa FROM sekolah WHERE sppg_id = ?");
        $stmt_siswa->execute([$sppg_id]);
        $total_siswa = $stmt_siswa->fetchColumn() ?: 0;

        // Menunggu Verifikasi Kantin Sesuai Filter (Created At)
        $stmt_verif = $db->prepare("SELECT COUNT(*) FROM kantin k JOIN sekolah s ON k.sekolah_id = s.id WHERE s.sppg_id = ? AND k.is_aktif = 0 AND k.created_at BETWEEN ? AND ?");
        $stmt_verif->execute([$sppg_id, $start_date_filter . ' 00:00:00', $end_date_filter . ' 23:59:59']);
        $total_verif = $stmt_verif->fetchColumn() ?: 0;

        // Kantin Aktif (Lifetime atau bisa berdasarkan filter)
        $stmt_aktif = $db->prepare("SELECT COUNT(*) FROM kantin k JOIN sekolah s ON k.sekolah_id = s.id WHERE s.sppg_id = ? AND k.is_aktif = 1");
        $stmt_aktif->execute([$sppg_id]);
        $kantin_aktif = $stmt_aktif->fetchColumn() ?: 0;

        // Point Dalam Periode Filter
        $stmt_point = $db->prepare("SELECT SUM(nominal) FROM transaksi_dana WHERE sppg_id = ? AND tanggal BETWEEN ? AND ? AND status IN ('Success', 'Berhasil')");
        $stmt_point->execute([$sppg_id, $start_date_filter . ' 00:00:00', $end_date_filter . ' 23:59:59']);
        $point_bulan_ini = $stmt_point->fetchColumn() ?: 0;

        // Info User & Saldo
        $stmt_user = $db->prepare("SELECT u.nama, s.nama_lembaga, s.saldo FROM users u JOIN sppg s ON u.id = s.user_id WHERE s.id = ?");
        $stmt_user->execute([$sppg_id]);
        $user_info = $stmt_user->fetch();

        $grafik = [];
        $hari_labels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
        $start_date = date('Y-m-d', strtotime("-6 days"));
        $end_date = date('Y-m-d');
        
        // 1. Ambil data dari tabel konsumsi_siswa
        $stmt_grafik = $db->prepare("
            SELECT DATE(ks.waktu_scan) as tanggal, COUNT(*) as total
            FROM konsumsi_siswa ks
            JOIN siswa sw ON ks.siswa_id = sw.id
            JOIN sekolah s ON sw.sekolah_id = s.id
            WHERE s.sppg_id = ? AND DATE(ks.waktu_scan) BETWEEN ? AND ?
            GROUP BY DATE(ks.waktu_scan)
        ");
        $stmt_grafik->execute([$sppg_id, $start_date, $end_date]);
        $data_konsumsi = $stmt_grafik->fetchAll(PDO::FETCH_KEY_PAIR);
        
        // (Query grafik kedua dihapus karena tabel transaksi_makan tidak ada)


        // Susun data 7 hari terakhir
        for ($i = 6; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $day_of_week = date('w', strtotime($date));
            $total = isset($data_konsumsi[$date]) ? $data_konsumsi[$date] : 0;
            
            $grafik[] = [
                "label" => $hari_labels[(int)$day_of_week],
                "value" => (int)$total,
                "date" => $date
            ];
        }

        // Riwayat Transaksi
        $stmt_trans = $db->prepare("
            SELECT t.id, t.nominal as amount, DATE_FORMAT(t.tanggal, '%d %b, %H:%i') as date, 
            t.metode as type, t.status, s.nama_sekolah as ref
            FROM transaksi_dana t
            JOIN sekolah s ON t.sekolah_id = s.id
            WHERE t.sppg_id = ? 
            ORDER BY t.tanggal DESC LIMIT 5
        ");
        $stmt_trans->execute([$sppg_id]);
        $riwayat_transaksi = $stmt_trans->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "data" => [
                "user" => [
                    "nama" => $user_info['nama'] ?? 'Admin',
                    "lembaga" => $user_info['nama_lembaga'] ?? 'SPPG'
                ],
                "total_sekolah" => (int)$total_sekolah,
                "total_siswa" => (int)$total_siswa,
                "total_verifikasi" => (int)$total_verif,
                "kantin_aktif" => (int)$kantin_aktif,
                "point_bulan_ini" => (float)$point_bulan_ini,
                "saldo" => 0, // Saldo SPPG dihilangkan sesuai permintaan
                "daftar_sekolah" => $daftar_sekolah,
                "riwayat_transaksi" => $riwayat_transaksi,
                "kehadiran_hari_ini" => (int)$kehadiran_hari_ini,
                "grafik_konsumsi" => $grafik
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage(), "line" => $e->getLine()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "SPPG ID tidak ditemukan"]);
}
?>
