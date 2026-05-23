<?php
header("Content-Type: application/json");
include_once __DIR__ . '/../shared/config.php';

$data = json_decode(file_get_contents("php://input"));

if (empty($data->menu_id) || empty($data->role) || empty($data->feedback)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Data tidak lengkap."]);
    exit;
}

try {
    $column = ($data->role === 'sppg') ? 'feedback_sppg' : 'feedback_sekolah';
    
    $stmt = $db->prepare("UPDATE menu_harian SET $column = ? WHERE id = ?");
    $stmt->execute([$data->feedback, $data->menu_id]);

    // Send notification to related canteen
    include_once __DIR__ . '/../shared/notifications_helper.php';
    $stmtKantin = $db->prepare("
        SELECT mh.nama_menu, k.user_id, k.sekolah_id
        FROM menu_harian mh
        JOIN kantin k ON mh.kantin_id = k.id
        WHERE mh.id = ?
    ");
    $stmtKantin->execute([$data->menu_id]);
    $kantinInfo = $stmtKantin->fetch(PDO::FETCH_ASSOC);

    if ($kantinInfo) {
        $adminType = ($data->role === 'sppg') ? 'Admin SPPG' : 'Admin Sekolah';
        $title = "Feedback Menu Harian";
        $message = "$adminType memberikan feedback untuk menu '" . $kantinInfo['nama_menu'] . "': " . $data->feedback;
        createNotification($db, $title, $message, "feedback_menu", "kantin", $kantinInfo['sekolah_id'], $kantinInfo['user_id']);
    }

    echo json_encode([
        "status" => "success",
        "message" => "Feedback berhasil dikirim."
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
