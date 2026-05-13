<?php
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__ . '/../shared/config.php';

$sekolah_id = isset($_GET['sekolah_id']) ? $_GET['sekolah_id'] : null;

if (!$sekolah_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Sekolah ID diperlukan"]);
    exit();
}

try {
    $query = "SELECT k.*, u.username as email 
              FROM kantin k 
              JOIN users u ON k.user_id = u.id 
              WHERE k.sekolah_id = :sid AND u.is_active = 0
              ORDER BY k.created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute([':sid' => $sekolah_id]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $data
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
