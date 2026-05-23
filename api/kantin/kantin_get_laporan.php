<?php
header("Content-Type: application/json");
include_once __DIR__ . '/../shared/config.php';

$kantin_id_input = $_GET['kantin_id'] ?? '';

if (empty($kantin_id_input)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Kantin ID diperlukan."]);
    exit;
}

try {
    // 1. Cari data Kantin berdasarkan user_id (tabel users) atau id (tabel kantin)
    $stmtKantin = $db->prepare("SELECT id, nama_kantin FROM kantin WHERE user_id = ? OR id = ? LIMIT 1");
    $stmtKantin->execute([$kantin_id_input, $kantin_id_input]);
    $kantin = $stmtKantin->fetch(PDO::FETCH_ASSOC);

    if (!$kantin) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Kantin tidak ditemukan."]);
        exit;
    }
    $kantin_id = $kantin['id'];

    // 2. Hitung total PTS didapat
    $stmtTotalPts = $db->prepare("SELECT COALESCE(SUM(nominal), 0) as total FROM transaksi_siswa WHERE kantin_id = ? AND type = 'keluar'");
    $stmtTotalPts->execute([$kantin_id]);
    $total_pts = (float)$stmtTotalPts->fetch(PDO::FETCH_ASSOC)['total'];

    // 3. Hitung total transaksi
    $stmtTotalTrans = $db->prepare("SELECT COUNT(*) as total FROM transaksi_siswa WHERE kantin_id = ? AND type = 'keluar'");
    $stmtTotalTrans->execute([$kantin_id]);
    $total_transaksi = (int)$stmtTotalTrans->fetch(PDO::FETCH_ASSOC)['total'];

    // 4. Hitung rata-rata PTS/Siswa
    $stmtAvg = $db->prepare("SELECT COALESCE(AVG(nominal), 0) as total FROM transaksi_siswa WHERE kantin_id = ? AND type = 'keluar'");
    $stmtAvg->execute([$kantin_id]);
    $avg = round((float)$stmtAvg->fetch(PDO::FETCH_ASSOC)['total'], 1);

    // 5. Hitung transaksi minggu ini
    $stmtWeek = $db->prepare("SELECT COUNT(*) as total FROM transaksi_siswa WHERE kantin_id = ? AND type = 'keluar' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
    $stmtWeek->execute([$kantin_id]);
    $transaksi_minggu_ini = (int)$stmtWeek->fetch(PDO::FETCH_ASSOC)['total'];

    // 6. Ambil riwayat transaksi terkini (30 transaksi terakhir)
    $stmtHistory = $db->prepare("
        SELECT ts.id, ts.nominal as amount, ts.created_at, s.nama as student_name, s.kelas
        FROM transaksi_siswa ts
        JOIN siswa s ON ts.siswa_id = s.id
        WHERE ts.kantin_id = ? AND ts.type = 'keluar'
        ORDER BY ts.created_at DESC
        LIMIT 30
    ");
    $stmtHistory->execute([$kantin_id]);
    $rows = $stmtHistory->fetchAll(PDO::FETCH_ASSOC);

    $riwayat = [];
    foreach ($rows as $row) {
        $riwayat[] = [
            "id" => $row['id'],
            "nama" => "Siswa: " . ($row['student_name'] ?? 'Siswa'),
            "sub" => "Kelas " . ($row['kelas'] ?? '-') . " · " . date('d M Y H:i', strtotime($row['created_at'])),
            "amount" => (int)$row['amount']
        ];
    }

    echo json_encode([
        "status" => "success",
        "stats" => [
            "total_pts" => $total_pts,
            "total_transaksi" => $total_transaksi,
            "rata_rata" => $avg,
            "transaksi_minggu_ini" => $transaksi_minggu_ini
        ],
        "riwayat" => $riwayat
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
