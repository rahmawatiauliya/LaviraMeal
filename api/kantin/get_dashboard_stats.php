<?php
header("Content-Type: application/json");
include_once __DIR__ . '/../shared/config.php';

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if (!$user_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "User ID required"]);
    exit();
}

try {
    // 1. Ambil data Kantin berdasarkan user_id
    $stmtKantin = $db->prepare("SELECT id, nama_kantin, sekolah_id FROM kantin WHERE user_id = ?");
    $stmtKantin->execute([$user_id]);
    $kantin = $stmtKantin->fetch(PDO::FETCH_ASSOC);

    if (!$kantin) {
        // Jika belum ada di tabel kantin, coba ambil dari users (mungkin user baru)
        $stmtUser = $db->prepare("SELECT id, nama, sekolah_id FROM users WHERE id = ? AND role = 'kantin'");
        $stmtUser->execute([$user_id]);
        $kantin = $stmtUser->fetch(PDO::FETCH_ASSOC);
        $kantin['nama_kantin'] = $kantin['nama'];
        $kantin['id'] = $user_id; // Fallback
    }

    $kantin_id = $kantin['id'];

    // 1.5 Ambil Total Saldo Poin Akumulatif
    $stmtSaldo = $db->prepare("SELECT COALESCE(saldo, 0) as total_saldo FROM kantin WHERE id = ?");
    $stmtSaldo->execute([$kantin_id]);
    $saldoRow = $stmtSaldo->fetch(PDO::FETCH_ASSOC);
    $total_saldo = $saldoRow ? $saldoRow['total_saldo'] : 0;

    // 2. Hitung Pendapatan Hari Ini (dari transaksi_siswa)
    // Asumsi transaksi_siswa memiliki kolom kantin_id
    $stmtEarning = $db->prepare("
        SELECT COALESCE(SUM(nominal), 0) as total 
        FROM transaksi_siswa 
        WHERE kantin_id = ? AND DATE(created_at) = CURDATE() AND type = 'keluar'
    ");
    // Catatan: type 'keluar' bagi siswa adalah 'masuk' bagi kantin
    $stmtEarning->execute([$kantin_id]);
    $earning = $stmtEarning->fetch(PDO::FETCH_ASSOC);

    // 3. Hitung Jumlah Transaksi Hari Ini
    $stmtCount = $db->prepare("
        SELECT COUNT(*) as total 
        FROM transaksi_siswa 
        WHERE kantin_id = ? AND DATE(created_at) = CURDATE() AND type = 'keluar'
    ");
    $stmtCount->execute([$kantin_id]);
    $count = $stmtCount->fetch(PDO::FETCH_ASSOC);

    // 4. Ambil Riwayat Transaksi Terakhir (Last 5)
    $stmtHistory = $db->prepare("
        SELECT ts.id, ts.nominal as amount, ts.created_at, s.nama as student_name
        FROM transaksi_siswa ts
        LEFT JOIN siswa s ON ts.siswa_id = s.id
        WHERE ts.kantin_id = ? 
        ORDER BY ts.created_at DESC 
        LIMIT 5
    ");
    $stmtHistory->execute([$kantin_id]);
    $riwayat_db = $stmtHistory->fetchAll(PDO::FETCH_ASSOC);
    
    $riwayat = [];
    foreach($riwayat_db as $r) {
        $riwayat[] = [
            "id" => $r['id'],
            "message" => "Pembayaran dari " . ($r['student_name'] ?? "Siswa"),
            "amount" => (int)$r['amount'],
            "type" => "masuk",
            "created_at" => $r['created_at']
        ];
    }

    // 5. Ambil Ulasan/Feedback Terakhir (Last 5)
    try {
        $db->query("SELECT photo FROM feedback_kantin LIMIT 1");
    } catch (Exception $ex) {
        $db->exec("ALTER TABLE feedback_kantin ADD COLUMN photo VARCHAR(255) DEFAULT NULL");
    }
    try {
        $db->query("SELECT petugas_penerima FROM feedback_kantin LIMIT 1");
    } catch (Exception $ex) {
        $db->exec("ALTER TABLE feedback_kantin ADD COLUMN petugas_penerima VARCHAR(150) DEFAULT NULL");
    }

    $stmtFeedback = $db->prepare("
        SELECT f.id, f.rating, f.komentar as comment, f.petugas_penerima as user, f.photo, f.created_at
        FROM feedback_kantin f
        WHERE f.kantin_id = ?
        ORDER BY f.created_at DESC
        LIMIT 5
    ");
    $stmtFeedback->execute([$kantin_id]);
    $feedbacks = $stmtFeedback->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => [
            "total_pendapatan" => (int)$earning['total'],
            "total_saldo" => (int)$total_saldo,
            "transaksi_hari_ini" => (int)$count['total'],
            "riwayat" => $riwayat,
            "notifikasi" => $feedbacks
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
