<?php
include_once __DIR__ . '/../shared/config.php';

$sppg_id = isset($_GET['sppg_id']) ? $_GET['sppg_id'] : null;

if (!empty($sppg_id)) {
    try {
        // Real-time Sync: Pastikan SMAN 1 Klari ada dan terhubung dengan SPPG
        $stmt_sman = $db->query("SELECT id FROM sekolah WHERE nama_sekolah LIKE '%Klari%' LIMIT 1");
        $sman = $stmt_sman->fetch();
        if (!$sman) {
            $sman_id = 'sekolah-sman-1-klari-000000000001';
            $db->prepare("
                INSERT INTO sekolah (id, sppg_id, nama_sekolah, npsn, alamat, jumlah_siswa)
                VALUES (?, ?, 'SMAN 1 Klari', '20223456', 'Jl. Raya Klari No. 1, Karawang', 320)
            ")->execute([$sman_id, $sppg_id]);
            $sman_id_actual = $sman_id;
        } else {
            $sman_id_actual = $sman['id'];
        }
        

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

        // Menunggu Verifikasi Kantin (Status Pending)
        $stmt_verif = $db->prepare("SELECT COUNT(*) FROM kantin k JOIN sekolah s ON k.sekolah_id = s.id WHERE s.sppg_id = ? AND k.status_sppg = 'pending'");
        $stmt_verif->execute([$sppg_id]);
        $total_verif = $stmt_verif->fetchColumn() ?: 0;

        // Kantin Aktif (Real-time): Jumlah kantin aktif di bawah naungan sekolah SPPG ini
        $stmt_aktif = $db->prepare("SELECT COUNT(*) FROM kantin k JOIN sekolah s ON k.sekolah_id = s.id WHERE s.sppg_id = ? AND k.is_aktif = 1");
        $stmt_aktif->execute([$sppg_id]);
        $kantin_aktif = $stmt_aktif->fetchColumn() ?: 0;

        // Point Terdistribusi (Real-time): Semua poin yang dikirim / ditransfer ke sekolah
        $stmt_point = $db->prepare("SELECT SUM(nominal) FROM transaksi_dana WHERE sppg_id = ?");
        $stmt_point->execute([$sppg_id]);
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

        // 1. Ambil riwayat transfer dari transaksi_dana
        $stmt_trans = $db->prepare("
            SELECT 'Kirim' as type, t.nominal as amount, DATE_FORMAT(t.tanggal, '%d %b, %H:%i') as date, 
            t.status, s.nama_sekolah as ref, t.tanggal as raw_date
            FROM transaksi_dana t
            LEFT JOIN sekolah s ON t.sekolah_id = s.id
            WHERE t.sppg_id = ? 
            ORDER BY t.tanggal DESC LIMIT 5
        ");
        $stmt_trans->execute([$sppg_id]);
        $trans_list = $stmt_trans->fetchAll(PDO::FETCH_ASSOC);

        // 2. Ambil kantin pending untuk verifikasi
        $stmt_pending = $db->prepare("
            SELECT 'Verifikasi' as type, 0 as amount, DATE_FORMAT(k.created_at, '%d %b, %H:%i') as date,
            'Baru' as status, CONCAT(k.nama_kantin, ' - ', s.nama_sekolah) as ref, k.created_at as raw_date
            FROM kantin k
            JOIN sekolah s ON k.sekolah_id = s.id
            WHERE s.sppg_id = ? AND k.is_aktif = 0
            ORDER BY k.created_at DESC LIMIT 5
        ");
        $stmt_pending->execute([$sppg_id]);
        $pending_list = $stmt_pending->fetchAll(PDO::FETCH_ASSOC);

        // 3. Gabungkan dan urutkan berdasarkan raw_date DESC
        $combined_logs = array_merge($trans_list, $pending_list);
        usort($combined_logs, function($a, $b) {
            return strcmp($b['raw_date'], $a['raw_date']);
        });
        $riwayat_transaksi = array_slice($combined_logs, 0, 5);

        // Notifikasi SPPG
        $stmt_notif = $db->prepare("SELECT id, title, message as comment, type, created_at FROM notifications WHERE role = 'sppg' AND is_read = 0 ORDER BY created_at DESC LIMIT 10");
        $stmt_notif->execute();
        $notifikasi = $stmt_notif->fetchAll(PDO::FETCH_ASSOC);

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
                "poin_distribusi" => (float)$point_bulan_ini,
                "saldo" => 0, // Saldo SPPG dihilangkan sesuai permintaan
                "daftar_sekolah" => $daftar_sekolah,
                "riwayat_transaksi" => $riwayat_transaksi,
                "kehadiran_hari_ini" => (int)$kehadiran_hari_ini,
                "grafik_konsumsi" => $grafik,
                "notifikasi" => $notifikasi
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
