<?php
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__ . '/../shared/config.php';

$data = json_decode(file_get_contents("php://input"), true);

$sppg_id = $data['sppg_id'] ?? null;

if (!$sppg_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "SPPG ID diperlukan"]);
    exit();
}

try {
    $db->beginTransaction();

    // Ambil semua kantin yang berada di bawah SPPG ini (via sekolah)
    $stmtGetKantin = $db->prepare("
        SELECT k.id as kantin_id, k.user_id
        FROM kantin k
        JOIN sekolah s ON k.sekolah_id = s.id
        WHERE s.sppg_id = ?
    ");
    $stmtGetKantin->execute([$sppg_id]);
    $kantinList = $stmtGetKantin->fetchAll(PDO::FETCH_ASSOC);

    if (empty($kantinList)) {
        $db->rollBack();
        echo json_encode(["status" => "success", "message" => "Tidak ada data kantin yang ditemukan.", "deleted" => 0]);
        exit();
    }

    $userIds   = array_column($kantinList, 'user_id');
    $kantinIds = array_column($kantinList, 'kantin_id');

    // Hapus data konsumsi siswa terkait kantin ini
    if (!empty($kantinIds)) {
        $placeholders = implode(',', array_fill(0, count($kantinIds), '?'));
        $db->prepare("DELETE FROM konsumsi_siswa WHERE kantin_id IN ($placeholders)")->execute($kantinIds);
    }

    // Hapus semua data kantin
    if (!empty($kantinIds)) {
        $placeholders = implode(',', array_fill(0, count($kantinIds), '?'));
        $db->prepare("DELETE FROM kantin WHERE id IN ($placeholders)")->execute($kantinIds);
    }

    // Hapus akun user kantin
    if (!empty($userIds)) {
        $placeholders = implode(',', array_fill(0, count($userIds), '?'));
        $db->prepare("DELETE FROM users WHERE id IN ($placeholders) AND role = 'kantin'")->execute($userIds);
    }

    $db->commit();

    echo json_encode([
        "status"  => "success",
        "message" => count($kantinIds) . " data kantin berhasil dihapus.",
        "deleted" => count($kantinIds)
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
