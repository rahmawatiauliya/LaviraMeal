<?php
include_once __DIR__ . '/../shared/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$sekolah_id = isset($_GET['sekolah_id']) ? $_GET['sekolah_id'] : '';

if (!$sekolah_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Sekolah ID is required"]);
    exit();
}

try {
    $query = "SELECT g.*, u.email, u.is_active 
              FROM guru g
              JOIN users u ON g.user_id = u.id
              WHERE g.sekolah_id = ?
              ORDER BY g.nama ASC";
    
    $stmt = $db->prepare($query);
    $stmt->execute([$sekolah_id]);
    $gurus = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $gurus
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
