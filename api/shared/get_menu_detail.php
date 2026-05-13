<?php
include_once __DIR__ . '/config.php';
header("Content-Type: application/json");

$post_id = isset($_GET['post_id']) ? $_GET['post_id'] : null;

if (!$post_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Post ID is required"]);
    exit();
}

try {
    // 1. Ambil detail postingan
    $stmt = $db->prepare("SELECT mk.*, k.nama_kantin, s.nama_sekolah 
                          FROM menu_kantin mk
                          JOIN kantin k ON mk.kantin_id = k.id
                          JOIN sekolah s ON mk.sekolah_id = s.id
                          WHERE mk.id = ?");
    $stmt->execute([$post_id]);
    $post = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$post) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Post not found"]);
        exit();
    }

    // 2. Ambil komentar
    $stmt_comm = $db->prepare("SELECT mkc.*, u.nama as admin_nama, u.role as admin_role
                              FROM menu_kantin_komentar mkc
                              JOIN users u ON mkc.admin_id = u.id
                              WHERE mkc.menu_kantin_id = ?
                              ORDER BY mkc.created_at ASC");
    $stmt_comm->execute([$post_id]);
    $comments = $stmt_comm->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => [
            "post" => $post,
            "comments" => $comments
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
