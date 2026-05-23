<?php
include_once __DIR__ . '/../shared/config.php';

// Endpoint untuk memproses distribusi poin (instan)
// Payload: sekolah_id, type ('kelas'/'guru'), target_id (kelas_nama atau guru_id)

$data = json_decode(file_get_contents("php://input"), true);

$sekolah_id = $data['sekolah_id'] ?? null;
$type = $data['type'] ?? 'kelas';
$target_id = $data['target_id'] ?? null;

if (!$sekolah_id || !$target_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
    exit();
}

try {
    // Pastikan kolom saldo ada (Pattern aman untuk MySQL versi lama)
    try { $db->query("SELECT saldo FROM siswa LIMIT 1"); } catch (Exception $e) { $db->exec("ALTER TABLE siswa ADD COLUMN saldo DECIMAL(15,2) DEFAULT 0"); }
    try { $db->query("SELECT saldo FROM guru LIMIT 1"); } catch (Exception $e) { $db->exec("ALTER TABLE guru ADD COLUMN saldo DECIMAL(15,2) DEFAULT 0"); }
    try { $db->query("SELECT saldo FROM sekolah LIMIT 1"); } catch (Exception $e) { $db->exec("ALTER TABLE sekolah ADD COLUMN saldo DECIMAL(15,2) DEFAULT 0"); }

    $db->beginTransaction();

    // 1. Ambil nominal dari jadwal
    $stmt = $db->prepare("SELECT monthly_amount FROM sekolah_poin_jadwal WHERE sekolah_id = ? AND target_type = ? AND target_identifier = ?");
    $stmt->execute([$sekolah_id, $type, $target_id]);
    $jadwal = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$jadwal) {
        throw new Exception("Jadwal distribusi belum diatur");
    }

    $amount = (float)$jadwal['monthly_amount'];
    if ($amount <= 0) {
        throw new Exception("Nominal poin harus lebih dari 0");
    }

    // 2. Cek saldo sekolah
    $stmt = $db->prepare("SELECT saldo FROM sekolah WHERE id = ?");
    $stmt->execute([$sekolah_id]);
    $sekolah = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($sekolah['saldo'] < $amount) {
        throw new Exception("Saldo sekolah tidak mencukupi (Butuh $amount PTS)");
    }

    // 3. Eksekusi Distribusi
    if ($type === 'kelas') {
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM siswa WHERE sekolah_id = ? AND kelas = ?");
        $stmt->execute([$sekolah_id, $target_id]);
        $siswa_count = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        if ($siswa_count <= 0) throw new Exception("Tidak ada siswa di kelas $target_id");

        $per_siswa = $amount / $siswa_count;

        // Potong saldo sekolah
        $stmt = $db->prepare("UPDATE sekolah SET saldo = saldo - ? WHERE id = ?");
        $stmt->execute([$amount, $sekolah_id]);

        // Tambah saldo siswa
        $stmt = $db->prepare("UPDATE siswa SET saldo = saldo + ? WHERE sekolah_id = ? AND kelas = ?");
        $stmt->execute([$per_siswa, $sekolah_id, $target_id]);

        $log_msg = "Distribusi poin ke Kelas $target_id sebesar $amount PTS ($per_siswa per siswa)";

    } else {
        // Distribusi ke Guru
        $stmt = $db->prepare("UPDATE sekolah SET saldo = saldo - ? WHERE id = ?");
        $stmt->execute([$amount, $sekolah_id]);

        $stmt = $db->prepare("UPDATE guru SET saldo = saldo + ? WHERE id = ?");
        $stmt->execute([$amount, $target_id]);

        $log_msg = "Distribusi poin ke Guru ID $target_id sebesar $amount PTS";
    }

    // 4. Update riwayat distribusi
    $stmt = $db->prepare("UPDATE sekolah_poin_jadwal SET last_distributed = NOW() WHERE sekolah_id = ? AND target_type = ? AND target_identifier = ?");
    $stmt->execute([$sekolah_id, $type, $target_id]);

    // 5. Log Aktivitas
    $stmt = $db->prepare("INSERT INTO activity_logs (sekolah_id, type, message, detail, created_at) VALUES (?, 'DISTRIBUSI_POIN', 'Distribusi Poin', ?, NOW())");
    $stmt->execute([$sekolah_id, $log_msg]);

    $db->commit();

    echo json_encode([
        "status" => "success", 
        "message" => "Distribusi berhasil diproses: $log_msg"
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
