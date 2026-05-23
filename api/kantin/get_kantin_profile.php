<?php
header("Content-Type: application/json");
include_once __DIR__ . '/../shared/config.php';

$user_id = $_GET['user_id'] ?? '';

if (empty($user_id)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "User ID diperlukan"]);
    exit;
}

try {
    $stmt = $db->prepare("SELECT k.*, s.nama_sekolah 
                          FROM kantin k 
                          JOIN sekolah s ON k.sekolah_id = s.id 
                          WHERE k.user_id = ?");
    $stmt->execute([$user_id]);
    $kantin = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($kantin) {
        echo json_encode([
            "status" => "success",
            "data" => $kantin
        ]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Profil kantin tidak ditemukan."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
