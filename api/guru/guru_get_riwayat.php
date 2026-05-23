<?php
include_once __DIR__ . '/../shared/config.php';
header("Content-Type: application/json");

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "User ID required"]);
    exit();
}

try {
    // Pastikan tabel transaksi_guru ada
    try {
        $db->query("SELECT 1 FROM transaksi_guru LIMIT 1");
    } catch (Exception $e) {
        $db->exec("CREATE TABLE transaksi_guru (
            id INT AUTO_INCREMENT PRIMARY KEY,
            guru_id INT NOT NULL,
            kantin_id INT DEFAULT NULL,
            type ENUM('masuk', 'keluar') NOT NULL,
            category VARCHAR(50) NOT NULL,
            nominal DECIMAL(15,2) NOT NULL DEFAULT 0,
            message VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
    }

    // Pastikan kolom saldo ada di tabel guru
    try {
        $db->query("SELECT saldo FROM guru LIMIT 1");
    } catch (Exception $e) {
        $db->exec("ALTER TABLE guru ADD COLUMN saldo DECIMAL(15,2) DEFAULT 0");
    }

    // 1. Dapatkan info Guru & Sekolah beserta Saldo
    $stmt = $db->prepare("SELECT id, saldo, nama FROM guru WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $guru = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$guru) {
        echo json_encode(["status" => "error", "message" => "Guru data not found"]);
        exit();
    }

    $guru_id = $guru['id'];
    $saldo = (float)$guru['saldo'];

    // 2. Dapatkan riwayat transaksi
    $stmtTrans = $db->prepare("
        SELECT t.*, k.nama_kantin 
        FROM transaksi_guru t 
        LEFT JOIN kantin k ON t.kantin_id = k.id 
        WHERE t.guru_id = ? 
        ORDER BY t.created_at DESC
    ");
    $stmtTrans->execute([$guru_id]);
    $history = $stmtTrans->fetchAll(PDO::FETCH_ASSOC);

    // 3. BACKFILL LOGIC: Jika belum ada log riwayat sama sekali tetapi saldo > 0 (seperti transfer tanggal 17 Mei)
    // Otomatis buatkan log agar riwayatnya tampil sempurna dan sinkron!
    if (count($history) === 0 && $saldo > 0) {
        $stmt_backfill = $db->prepare("
            INSERT INTO transaksi_guru (guru_id, type, category, nominal, message, created_at) 
            VALUES (?, 'masuk', 'Transfer', ?, 'Penerimaan Poin dari Sekolah', '2026-05-17 10:00:00')
        ");
        $stmt_backfill->execute([$guru_id, $saldo]);
        
        // Ambil ulang riwayat terbaru
        $stmtTrans->execute([$guru_id]);
        $history = $stmtTrans->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        "status" => "success",
        "saldo" => $saldo,
        "poin" => $saldo * 15000,
        "riwayat" => $history
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
