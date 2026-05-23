<?php
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__ . '/../shared/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->sekolah_id) || !isset($data->guru_id)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
    exit();
}

try {
    $db->beginTransaction();

    // 1. Ambil user_id dari guru tersebut sebelum dihapus
    $stmtUser = $db->prepare("SELECT user_id FROM guru WHERE id = :id AND sekolah_id = :sid");
    $stmtUser->execute([':id' => $data->guru_id, ':sid' => $data->sekolah_id]);
    $guru = $stmtUser->fetch(PDO::FETCH_ASSOC);

    if (!$guru) {
        throw new Exception("Guru tidak ditemukan");
    }

    // 2. Hapus dari tabel guru
    $stmtDelGuru = $db->prepare("DELETE FROM guru WHERE id = :id");
    $stmtDelGuru->execute([':id' => $data->guru_id]);

    // 3. Hapus dari tabel users
    if ($guru['user_id']) {
        $stmtDelUser = $db->prepare("DELETE FROM users WHERE id = :uid");
        $stmtDelUser->execute([':uid' => $guru['user_id']]);
    }

    $db->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Akun Guru berhasil dihapus"
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
