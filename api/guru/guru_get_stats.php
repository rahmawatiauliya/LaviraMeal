<?php
include_once __DIR__ . '/../shared/config.php';

header("Content-Type: application/json");

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "User ID required"]);
    exit();
}

try {
    // 1. Get Guru & Sekolah Info
    $stmt = $db->prepare("SELECT g.*, s.nama_sekolah 
                          FROM guru g 
                          JOIN sekolah s ON g.sekolah_id = s.id 
                          WHERE g.user_id = ?");
    $stmt->execute([$user_id]);
    $guru = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$guru) {
        echo json_encode(["status" => "error", "message" => "Guru data not found"]);
        exit();
    }

    $sekolah_id = $guru['sekolah_id'];
    $kelas_wali = $guru['kelas_wali'];

    // 2. Total Siswa in Class
    $stmtSiswa = $db->prepare("SELECT COUNT(*) as total FROM siswa WHERE sekolah_id = ? AND kelas = ?");
    $stmtSiswa->execute([$sekolah_id, $kelas_wali]);
    $total_siswa = $stmtSiswa->fetch(PDO::FETCH_ASSOC)['total'];

    // 3. Today's Distribution Schedule
    $stmtJadwal = $db->prepare("SELECT j.*, k.nama_kantin 
                                FROM jadwal_distribusi j 
                                JOIN kantin k ON j.kantin_id = k.id 
                                WHERE j.sekolah_id = ? AND j.tanggal = CURDATE() 
                                ORDER BY j.created_at DESC LIMIT 1");
    $stmtJadwal->execute([$sekolah_id]);
    $jadwal = $stmtJadwal->fetch(PDO::FETCH_ASSOC);

    // 4. Attendance Today for this class
    $absensi_today = 0;
    if ($jadwal) {
        $stmtAbsen = $db->prepare("SELECT COUNT(*) as total 
                                   FROM konsumsi_siswa ks 
                                   JOIN siswa s ON ks.siswa_id = s.id 
                                   WHERE ks.jadwal_id = ? AND s.kelas = ? AND ks.hadir = 1");
        $stmtAbsen->execute([$jadwal['id'], $kelas_wali]);
        $absensi_today = $stmtAbsen->fetch(PDO::FETCH_ASSOC)['total'];
    }

    // 5. Recent Notifications (Mock for now)
    $notif_count = 2;

    echo json_encode([
        "status" => "success",
        "data" => [
            "guru" => $guru,
            "total_siswa" => $total_siswa,
            "absensi_today" => $absensi_today,
            "jadwal_hari_ini" => $jadwal,
            "notif_unread" => $notif_count,
            "persentase_hadir" => $total_siswa > 0 ? round(($absensi_today / $total_siswa) * 100) : 0
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
