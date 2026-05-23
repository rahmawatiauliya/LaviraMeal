<?php
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__ . '/../shared/config.php';

$data = json_decode(file_get_contents("php://input"), true);

$kantin_id = $data['kantin_id'] ?? null;
$user_id = $data['user_id'] ?? null;

if (!$kantin_id || !$user_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "ID Kantin dan User diperlukan"]);
    exit();
}

try {
    $action = $data['action'] ?? 'approved';
    $notes = $data['notes'] ?? '';

    $db->beginTransaction();

    // 1. Update status_sekolah dan catatan_sekolah di tabel kantin
    $stmt1 = $db->prepare("UPDATE kantin SET status_sekolah = ?, catatan_sekolah = ? WHERE user_id = ?");
    $stmt1->execute([$action, $notes, $user_id]);

    if ($action === 'approved') {
        // 2. Cek apakah sudah disetujui juga oleh SPPG
        $check = $db->prepare("SELECT status_sppg FROM kantin WHERE user_id = ?");
        $check->execute([$user_id]);
        $kantin = $check->fetch(PDO::FETCH_ASSOC);

        if ($kantin && $kantin['status_sppg'] === 'approved') {
            // Keduanya sudah setuju, aktifkan akun!
            $db->prepare("UPDATE kantin SET is_aktif = 1 WHERE user_id = ?")->execute([$user_id]);
            $db->prepare("UPDATE users SET is_active = 1 WHERE id = ?")->execute([$user_id]);
            $msg = "Kantin berhasil disetujui Sekolah. Status: AKTIF.";
        } else {
            $msg = "Kantin berhasil disetujui Sekolah. Menunggu persetujuan Admin SPPG.";
        }
    } else {
        // Jika rejected, pastikan is_active = 0
        $db->prepare("UPDATE users SET is_active = 0 WHERE id = ?")->execute([$user_id]);
        $msg = "Kantin berhasil ditolak (Rejected) oleh Sekolah.";
    }

    $db->commit();

    echo json_encode([
        "status" => "success",
        "message" => $msg
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
