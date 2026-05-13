<?php
include_once __DIR__ . '/../shared/config.php';

// Endpoint untuk transfer dana dari saldo sekolah ke seluruh siswa dalam satu kelas tertentu
// Payload: sekolah_id, kelas, amount_per_siswa

$data = json_decode(file_get_contents("php://input"), true);

$sekolah_id = $data['sekolah_id'] ?? null;
$kelas = $data['kelas'] ?? null;
$total_amount_input = $data['amount'] ?? 0;

if (!$sekolah_id || !$kelas || $total_amount_input <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Data tidak lengkap atau nominal tidak valid"]);
    exit();
}

try {
    $db->beginTransaction();

    // 1. Hitung jumlah siswa di kelas tersebut
    $stmt_count = $db->prepare("SELECT COUNT(*) as total FROM siswa WHERE sekolah_id = ? AND kelas = ? AND aktif = 1");
    $stmt_count->execute([$sekolah_id, $kelas]);
    $total_siswa = $stmt_count->fetch(PDO::FETCH_ASSOC)['total'];

    if ($total_siswa == 0) {
        throw new Exception("Tidak ada siswa aktif di kelas $kelas untuk menerima dana");
    }

    // LOGIKA BARU: Total nominal dibagi rata ke seluruh siswa di kelas
    $amount_per_siswa = $total_amount_input / $total_siswa;
    $total_transfer = $total_amount_input; // Total yang dipotong dari sekolah adalah input user

    // 2. Cek saldo sekolah
    $stmt_sekolah = $db->prepare("SELECT saldo, nama_sekolah FROM sekolah WHERE id = ?");
    $stmt_sekolah->execute([$sekolah_id]);
    $sekolah = $stmt_sekolah->fetch(PDO::FETCH_ASSOC);

    if (!$sekolah) {
        throw new Exception("Sekolah tidak ditemukan");
    }

    if ($sekolah['saldo'] < $total_transfer) {
        throw new Exception("Saldo sekolah tidak mencukupi (Butuh: Rp " . number_format($total_transfer, 0, ',', '.') . ")");
    }

    // 3. Potong saldo sekolah
    $stmt_update_sekolah = $db->prepare("UPDATE sekolah SET saldo = saldo - ? WHERE id = ?");
    $stmt_update_sekolah->execute([$total_transfer, $sekolah_id]);

    // 4. Tambah saldo ke masing-masing siswa (Hasil pembagian rata)
    $stmt_update_siswa = $db->prepare("UPDATE siswa SET saldo = saldo + ? WHERE sekolah_id = ? AND kelas = ? AND aktif = 1");
    $stmt_update_siswa->execute([$amount_per_siswa, $sekolah_id, $kelas]);

    // 5. Catat ke activity_logs (Log Sekolah)
    $message = "Transfer Dana Kelas (Bagi Rata)";
    $detail = "Distribusi total Rp " . number_format($total_transfer, 0, ',', '.') . " ke Kelas $kelas. Masing-masing dari $total_siswa siswa menerima Rp " . number_format($amount_per_siswa, 2, ',', '.') . ".";
    
    $stmt_log = $db->prepare("INSERT INTO activity_logs (sekolah_id, type, message, detail) VALUES (?, 'TRANSFER_KELAS', ?, ?)");
    $stmt_log->execute([$sekolah_id, $message, $detail]);

    // 6. Catat ke transaksi_siswa (Log Siswa Individual)
    $stmt_trans_siswa = $db->prepare("INSERT INTO transaksi_siswa (siswa_id, type, category, nominal, message) 
                                      SELECT id, 'masuk', 'Transfer', ?, ? FROM siswa 
                                      WHERE sekolah_id = ? AND kelas = ? AND aktif = 1");
    $stmt_trans_siswa->execute([$amount_per_siswa, "Penerimaan Dana Kelas $kelas", $sekolah_id, $kelas]);

    $db->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Berhasil mentransfer dana ke $total_siswa siswa di kelas $kelas",
        "total_porsi" => $total_transfer
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
