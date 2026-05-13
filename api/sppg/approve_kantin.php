<?php
header("Content-Type: application/json");
include_once __DIR__ . '/../shared/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!empty($data->user_id)) {
        try {
            // Update user status menjadi aktif
            $query = "UPDATE users SET is_active = 1 WHERE id = :id AND role = 'kantin'";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $data->user_id);
            
            if ($stmt->execute()) {
                echo json_encode([
                    "status" => "success",
                    "message" => "Akun kantin berhasil disetujui."
                ]);
            } else {
                echo json_encode([
                    "status" => "error",
                    "message" => "Gagal menyetujui akun kantin."
                ]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "User ID tidak boleh kosong."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>
