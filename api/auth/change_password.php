<?php
include_once __DIR__ . '/../shared/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    $user_id = !empty($data->user_id) ? $data->user_id : '';
    $old_password = !empty($data->old_password) ? $data->old_password : '';
    $new_password = !empty($data->new_password) ? $data->new_password : '';

    if (empty($user_id) || empty($old_password) || empty($new_password)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
        exit;
    }

    // Ambil user dari DB
    $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = :id");
    $stmt->execute([':id' => $user_id]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "User tidak ditemukan"]);
        exit;
    }

    // Verifikasi password lama
    if (password_verify($old_password, $user['password_hash'])) {
        $new_password_hash = password_hash($new_password, PASSWORD_BCRYPT);
        $stmtUpdate = $db->prepare("UPDATE users SET password_hash = :password_hash WHERE id = :id");
        $stmtUpdate->execute([':password_hash' => $new_password_hash, ':id' => $user_id]);

        echo json_encode(["status" => "success", "message" => "Kata sandi berhasil diperbarui"]);
    } else {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Kata sandi lama salah"]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>
