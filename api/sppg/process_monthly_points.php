<?php
include_once __DIR__ . '/../shared/config.php';

header('Content-Type: application/json');

$currentMonth = date('m-Y');

try {
    $db->beginTransaction();

    // 1. Ambil semua sekolah yang memiliki jadwal poin bulanan
    // Dan pastikan belum menerima distribusi di bulan ini
    $query = "SELECT s.id, s.nama_sekolah, sp.monthly_amount 
              FROM sekolah s 
              JOIN scheduled_points sp ON s.id = sp.sekolah_id 
              WHERE (sp.last_distributed IS NULL OR DATE_FORMAT(sp.last_distributed, '%m-%Y') != :month)
              AND sp.distribution_day <= :today_day
              AND sp.status = 'active'";
    
    $stmt = $db->prepare($query);
    $stmt->execute([
        ':month' => $currentMonth,
        ':today_day' => (int)date('d')
    ]);
    $schools = $stmt->fetchAll();

    if (count($schools) === 0) {
        echo json_encode(["status" => "info", "message" => "Semua sekolah sudah menerima distribusi poin untuk bulan ini (" . $currentMonth . ")."]);
        exit;
    }

    $totalPointsDistributed = 0;
    $distributedTo = [];

    foreach ($schools as $school) {
        $amount = $school['monthly_amount'];
        $sekolahId = $school['id'];

        // 2. Tambah saldo sekolah
        $updateSekolah = "UPDATE sekolah SET saldo = saldo + ? WHERE id = ?";
        $db->prepare($updateSekolah)->execute([$amount, $sekolahId]);

        // 3. Catat transaksi
        $trx_id = 'AUTO-PTS-' . date('Ymd') . '-' . substr(md5($sekolahId), 0, 4);
        $insertTrx = "INSERT INTO transaksi_dana (id, sppg_id, sekolah_id, nominal, metode, status) 
                      VALUES (?, (SELECT id FROM sppg LIMIT 1), ?, ?, 'Auto-Monthly', 'Berhasil')";
        $db->prepare($insertTrx)->execute([$trx_id, $sekolahId, $amount]);

        // 4. Update tanggal terakhir distribusi di tabel jadwal
        $updateSchedule = "UPDATE scheduled_points SET last_distributed = CURDATE() WHERE sekolah_id = ?";
        $db->prepare($updateSchedule)->execute([$sekolahId]);

        $totalPointsDistributed += $amount;
        $distributedTo[] = $school['nama_sekolah'];
    }

    // 5. Simpan log distribusi
    $insertLog = "INSERT INTO point_distribution_logs (month_year, total_schools, total_points) VALUES (?, ?, ?)";
    $db->prepare($insertLog)->execute([$currentMonth, count($schools), $totalPointsDistributed]);

    $db->commit();
    
    echo json_encode([
        "status" => "success", 
        "message" => "Distribusi poin bulanan berhasil diproses.",
        "details" => [
            "month" => $currentMonth,
            "total_schools" => count($schools),
            "total_points" => $totalPointsDistributed,
            "schools" => $distributedTo
        ]
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Gagal memproses distribusi: " . $e->getMessage()]);
}
?>
