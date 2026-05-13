<?php
header("Content-Type: application/json");
include_once __DIR__ . '/../shared/config.php';

// Ambil sppg_id dari parameter URL (misal: ?sppg_id=...)
$sppg_id = $_GET['sppg_id'];

if (!empty($sppg_id)) {
    try {
        // 1. Hitung Total Sekolah di bawah SPPG ini
        $stmt1 = $db->prepare("SELECT COUNT(*) as total FROM sekolah WHERE sppg_id = ?");
        $stmt1->execute([$sppg_id]);
        $total_sekolah = $stmt1->fetch(PDO::FETCH_ASSOC)['total'];

        // 2. Hitung Total Siswa di seluruh sekolah milik SPPG ini
        $stmt2 = $db->prepare("SELECT COUNT(*) as total FROM siswa s 
                               JOIN sekolah sch ON s.sekolah_id = sch.id 
                               WHERE sch.sppg_id = ?");
        $stmt2->execute([$sppg_id]);
        $total_siswa = $stmt2->fetch(PDO::FETCH_ASSOC)['total'];

        // 3. Ambil Persentase Konsumsi Hari Ini (Real-time)
        $today = date('Y-m-d');
        $stmt3 = $db->prepare("SELECT SUM(total_target) as target, SUM(total_teralisasi) as realisasi 
                               FROM jadwal_makan j 
                               JOIN sekolah sch ON j.sekolah_id = sch.id 
                               WHERE sch.sppg_id = ? AND j.tanggal = ?");
        $stmt3->execute([$sppg_id, $today]);
        $stats = $stmt3->fetch(PDO::FETCH_ASSOC);

        $target = $stats['target'] ?? 0;
        $realisasi = $stats['realisasi'] ?? 0;
        $persen = ($target > 0) ? round(($realisasi / $target) * 100, 1) : 0;

        echo json_encode([
            "status" => "success",
            "data" => [
                "total_sekolah" => $total_sekolah,
                "total_siswa" => $total_siswa,
                "konsumsi_hari_ini" => $persen . "%",
                "realisasi_porsi" => $realisasi
            ]
        ]);

    }
    catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
else {
    echo json_encode(["status" => "error", "message" => "SPPG ID tidak ditemukan"]);
}
?>
