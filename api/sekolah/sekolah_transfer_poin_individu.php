<?php
include_once __DIR__ . '/../shared/config.php';

// Endpoint untuk transfer poin ke individu (siswa atau guru)
// Payload: sekolah_id, target_id, role (siswa/guru), amount

$data = json_decode(file_get_contents("php://input"), true);

$sekolah_id = $data['sekolah_id'] ?? null;
$target_id = $data['target_id'] ?? null;
$role = $data['role'] ?? 'siswa';
$amount = $data['amount'] ?? 0;

if (!$sekolah_id || !$target_id || $amount <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Data tidak lengkap atau nominal tidak valid"]);
    exit();
}

// Pastikan kolom saldo ada (di luar transaksi agar tidak terjadi implicit commit)
$table = ($role === 'siswa') ? 'siswa' : 'guru';
try {
    $db->query("SELECT saldo FROM $table LIMIT 1");
} catch (Exception $e) {
    $db->exec("ALTER TABLE $table ADD COLUMN saldo DECIMAL(15,2) DEFAULT 0");
}

try {
    $db->beginTransaction();

    // 1. Cek saldo sekolah
    $stmt_sekolah = $db->prepare("SELECT saldo, nama_sekolah FROM sekolah WHERE id = ?");
    $stmt_sekolah->execute([$sekolah_id]);
    $sekolah = $stmt_sekolah->fetch(PDO::FETCH_ASSOC);

    if (!$sekolah) {
        throw new Exception("Sekolah tidak ditemukan");
    }

    if ($sekolah['saldo'] < $amount) {
        throw new Exception("Saldo sekolah tidak mencukupi");
    }

    // 2. Verifikasi target
    $stmt_target = $db->prepare("SELECT id, nama FROM $table WHERE id = ? AND sekolah_id = ?");
    $stmt_target->execute([$target_id, $sekolah_id]);
    $target = $stmt_target->fetch(PDO::FETCH_ASSOC);

    if (!$target) {
        throw new Exception("Target ($role) tidak ditemukan di sekolah ini");
    }

    // 3. Proses Transfer
    // Potong saldo sekolah
    $stmt_update_sekolah = $db->prepare("UPDATE sekolah SET saldo = saldo - ? WHERE id = ?");
    $stmt_update_sekolah->execute([$amount, $sekolah_id]);

    // Tambah saldo target
    $stmt_update_target = $db->prepare("UPDATE $table SET saldo = saldo + ? WHERE id = ?");
    $stmt_update_target->execute([$amount, $target_id]);

    // 4. Catat Log
    $log_msg = "Transfer Poin ke Individual ($role)";
    $log_detail = "Transfer $amount PTS ke $role: " . $target['nama'];
    $stmt_log = $db->prepare("INSERT INTO activity_logs (sekolah_id, type, message, detail) VALUES (?, 'TRANSFER_INDIVIDU', ?, ?)");
    $stmt_log->execute([$sekolah_id, $log_msg, $log_detail]);

    // 5. Catat Transaksi untuk target
    if ($role === 'siswa') {
        $stmt_trans = $db->prepare("INSERT INTO transaksi_siswa (siswa_id, type, category, nominal, message) VALUES (?, 'masuk', 'Transfer', ?, ?)");
        $stmt_trans->execute([$target_id, $amount, "Penerimaan Poin dari Sekolah"]);
    } else if ($role === 'guru') {
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
        $stmt_trans = $db->prepare("INSERT INTO transaksi_guru (guru_id, type, category, nominal, message) VALUES (?, 'masuk', 'Transfer', ?, ?)");
        $stmt_trans->execute([$target_id, $amount, "Penerimaan Poin dari Sekolah"]);
    }

    $db->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Berhasil mengirim $amount PTS ke " . $target['nama'],
        "new_balance" => $sekolah['saldo'] - $amount
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
