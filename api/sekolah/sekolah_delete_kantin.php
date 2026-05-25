<?php
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__ . '/../shared/config.php';

$data = json_decode(file_get_contents("php://input"), true);

$kantin_id  = $data['kantin_id']  ?? null;
$sekolah_id = $data['sekolah_id'] ?? null;

if (!$kantin_id || !$sekolah_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "ID Kantin dan Sekolah diperlukan"]);
    exit();
}

try {
    // Pastikan kantin milik sekolah ini
    $check = $db->prepare("SELECT id, user_id FROM kantin WHERE id = ? AND sekolah_id = ? LIMIT 1");
    $check->execute([$kantin_id, $sekolah_id]);
    $kantin = $check->fetch(PDO::FETCH_ASSOC);

    if (!$kantin) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Kantin tidak ditemukan atau bukan milik sekolah ini"]);
        exit();
    }

    $db->beginTransaction();

    $user_id = $kantin['user_id'];

    // Nonaktifkan akun user kantin
    $db->prepare("UPDATE users SET is_active = 0 WHERE id = ?")->execute([$user_id]);

    // Hapus data kantin
    $db->prepare("DELETE FROM kantin WHERE id = ? AND sekolah_id = ?")->execute([$kantin_id, $sekolah_id]);

    $db->commit();

    echo json_encode([
        "status"  => "success",
        "message" => "Kantin berhasil dihapus dari daftar sekolah."
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
