<?php
include_once __DIR__ . '/../shared/config.php';

$sekolah_id = isset($_GET['sekolah_id']) ? $_GET['sekolah_id'] : null;
$kelas_filter = isset($_GET['kelas']) && $_GET['kelas'] !== 'All' && $_GET['kelas'] !== '' ? $_GET['kelas'] : null;
$tanggal_filter = isset($_GET['tanggal']) && $_GET['tanggal'] !== '' ? $_GET['tanggal'] : null;

if (!$sekolah_id) {
    echo json_encode(["status" => "error", "message" => "Sekolah ID required"]);
    exit();
}

try {
    // 1. Get School Info
    $stmt = $db->prepare("SELECT * FROM sekolah WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $sekolah_id]);
    $sekolah = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $nama_sekolah = $sekolah ? $sekolah['nama_sekolah'] : 'Sekolah';
    $saldo = $sekolah ? (int)$sekolah['saldo'] : 0;
    $kode_undangan = '-'; // Default jika tidak ada

    // 2. Metrics (Total Siswa - respects class filter)
    $total_siswa = 0;
    try {
        if ($kelas_filter) {
            $stmtSiswa = $db->prepare("SELECT COUNT(*) as total FROM siswa WHERE sekolah_id = :id AND kelas = :kelas");
            $stmtSiswa->execute([':id' => $sekolah_id, ':kelas' => $kelas_filter]);
        } else {
            $stmtSiswa = $db->prepare("SELECT COUNT(*) as total FROM siswa WHERE sekolah_id = :id");
            $stmtSiswa->execute([':id' => $sekolah_id]);
        }
        $total_siswa = (int)$stmtSiswa->fetch(PDO::FETCH_ASSOC)['total'];
    } catch (Exception $e) {}

    // 2.5. Guru (Pendidik)
    $total_guru = 0;
    $guru_aktif = 0;
    try {
        // Total guru
        $stmtTotalGuru = $db->prepare("SELECT COUNT(*) as total FROM guru WHERE sekolah_id = :id");
        $stmtTotalGuru->execute([':id' => $sekolah_id]);
        $total_guru = (int)$stmtTotalGuru->fetch(PDO::FETCH_ASSOC)['total'];

        // Guru aktif
        $stmtGuruAktif = $db->prepare("SELECT COUNT(*) as total FROM guru g JOIN users u ON g.user_id = u.id WHERE g.sekolah_id = :id AND u.is_active = 1");
        $stmtGuruAktif->execute([':id' => $sekolah_id]);
        $guru_aktif = (int)$stmtGuruAktif->fetch(PDO::FETCH_ASSOC)['total'];
    } catch (Exception $e) {}

    // 3. Kantin
    $kantin_aktif = 0;
    $total_kantin = 0;
    $kantin_list = [];
    try {
        // Total kantin
        $stmtTotalKantin = $db->prepare("SELECT COUNT(*) as total FROM kantin WHERE sekolah_id = :id");
        $stmtTotalKantin->execute([':id' => $sekolah_id]);
        $total_kantin = (int)$stmtTotalKantin->fetch(PDO::FETCH_ASSOC)['total'];

        // Kantin aktif
        $stmtKantin = $db->prepare("SELECT COUNT(*) as total FROM kantin WHERE sekolah_id = :id AND is_aktif = 1");
        $stmtKantin->execute([':id' => $sekolah_id]);
        $kantin_aktif = (int)$stmtKantin->fetch(PDO::FETCH_ASSOC)['total'];
        
        // List detail kantin
        $stmtKantinList = $db->prepare("SELECT id, nama_kantin, pemilik AS penanggung_jawab, is_aktif FROM kantin WHERE sekolah_id = :id ORDER BY is_aktif DESC");
        $stmtKantinList->execute([':id' => $sekolah_id]);
        $kantin_list = $stmtKantinList->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {}

    // 4. Notifications
    $stmtNotif = $db->prepare("SELECT id, title, message as comment, type, created_at FROM notifications WHERE role = 'sekolah' AND sekolah_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 10");
    $stmtNotif->execute([$sekolah_id]);
    $notifikasi = $stmtNotif->fetchAll(PDO::FETCH_ASSOC);

    // 5. Calculate Daily redemptions (makan = 1) and non-redemptions (unclaimed)
    $weekdays = [];
    $d = new DateTime();
    for ($i = 0; $i < 10; $i++) {
        $w = (int)$d->format('w');
        if ($w !== 0 && $w !== 6) {
            $weekdays[] = clone $d;
        }
        if (count($weekdays) === 5) {
            break;
        }
        $d->modify('-1 day');
    }
    $weekdays = array_reverse($weekdays);

    $day_mapping = [
        1 => 'Sen',
        2 => 'Sel',
        3 => 'Rab',
        4 => 'Kam',
        5 => 'Jum',
        6 => 'Sab',
        0 => 'Min'
    ];

    $chart_labels = [];
    $chart_claimed = [];
    $chart_unclaimed = [];

    foreach ($weekdays as $wd) {
        $date_str = $wd->format('Y-m-d');
        $day_num = (int)$wd->format('w');
        $chart_labels[] = $day_mapping[$day_num];

        if ($kelas_filter) {
            $stmtClaimed = $db->prepare("
                SELECT COUNT(*) as total 
                FROM konsumsi_siswa ks 
                JOIN siswa sw ON ks.siswa_id = sw.id 
                WHERE sw.sekolah_id = :sekolah_id AND ks.makan = 1 AND DATE(ks.waktu_scan) = :date_str AND sw.kelas = :kelas
            ");
            $stmtClaimed->execute([':sekolah_id' => $sekolah_id, ':date_str' => $date_str, ':kelas' => $kelas_filter]);
        } else {
            $stmtClaimed = $db->prepare("
                SELECT COUNT(*) as total 
                FROM konsumsi_siswa ks 
                JOIN siswa sw ON ks.siswa_id = sw.id 
                WHERE sw.sekolah_id = :sekolah_id AND ks.makan = 1 AND DATE(ks.waktu_scan) = :date_str
            ");
            $stmtClaimed->execute([':sekolah_id' => $sekolah_id, ':date_str' => $date_str]);
        }
        $claimed = (int)$stmtClaimed->fetch(PDO::FETCH_ASSOC)['total'];
        
        $unclaimed = max(0, $total_siswa - $claimed);

        $chart_claimed[] = $claimed;
        $chart_unclaimed[] = $unclaimed;
    }

    // 6. Get Dynamic Classes List for Filtering
    $stmtClasses = $db->prepare("SELECT DISTINCT kelas FROM siswa WHERE sekolah_id = :id AND kelas IS NOT NULL AND kelas != '' ORDER BY kelas ASC");
    $stmtClasses->execute([':id' => $sekolah_id]);
    $daftar_kelas = $stmtClasses->fetchAll(PDO::FETCH_COLUMN) ?: [];

    // 7. Generate last 30 calendar days dynamically to allow picking any past dates
    $daftar_tanggal = [];
    for ($i = 0; $i < 30; $i++) {
        $daftar_tanggal[] = date('Y-m-d', strtotime("-$i days"));
    }

    // 8. Determine active date for the pie chart
    if ($tanggal_filter) {
        $active_date = $tanggal_filter;
    } else {
        $active_date = count($daftar_tanggal) > 0 ? $daftar_tanggal[0] : date('Y-m-d');
    }

    // 9. Calculate Pie Chart metrics for the active date
    if ($kelas_filter) {
        $stmtPie = $db->prepare("
            SELECT COUNT(*) as total 
            FROM konsumsi_siswa ks 
            JOIN siswa sw ON ks.siswa_id = sw.id 
            WHERE sw.sekolah_id = :id AND ks.makan = 1 AND DATE(ks.waktu_scan) = :date_str AND sw.kelas = :kelas
        ");
        $stmtPie->execute([':id' => $sekolah_id, ':date_str' => $active_date, ':kelas' => $kelas_filter]);
    } else {
        $stmtPie = $db->prepare("
            SELECT COUNT(*) as total 
            FROM konsumsi_siswa ks 
            JOIN siswa sw ON ks.siswa_id = sw.id 
            WHERE sw.sekolah_id = :id AND ks.makan = 1 AND DATE(ks.waktu_scan) = :date_str
        ");
        $stmtPie->execute([':id' => $sekolah_id, ':date_str' => $active_date]);
    }
    $pie_claimed = (int)$stmtPie->fetch(PDO::FETCH_ASSOC)['total'];
    $pie_unclaimed = max(0, $total_siswa - $pie_claimed);

    echo json_encode([
        "status" => "success",
        "data" => [
            "total_siswa" => $total_siswa,
            "total_guru" => $total_guru,
            "guru_aktif" => $guru_aktif,
            "saldo" => $saldo,
            "nama_sekolah" => $nama_sekolah,
            "kantin_aktif" => $kantin_aktif,
            "total_kantin" => $total_kantin,
            "kantin_list" => $kantin_list,
            "verifikasi_kantin" => 1,
            "kode_undangan" => $kode_undangan,
            "pengambilan_hari_ini" => 0,
            "status_distribusi" => "Normal",
            "notifikasi" => $notifikasi,
            "menus" => [],
            "chart_data" => [
                "labels" => $chart_labels,
                "claimed" => $chart_claimed,
                "unclaimed" => $chart_unclaimed
            ],
            "pie_chart" => [
                "taking" => $pie_claimed,
                "not_taking" => $pie_unclaimed,
                "date" => $active_date
            ],
            "daftar_kelas" => $daftar_kelas,
            "daftar_tanggal" => $daftar_tanggal
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Gagal memuat statistik: " . $e->getMessage()
    ]);
}
?>
