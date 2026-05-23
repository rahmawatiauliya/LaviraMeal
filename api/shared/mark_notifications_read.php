<?php
include_once __DIR__ . '/config.php';

// Allow CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$data = json_decode(file_get_contents('php://input'));

$role = isset($data->role) ? $data->role : null;
$sekolah_id = isset($data->sekolah_id) ? $data->sekolah_id : null;
$sppg_id = isset($data->sppg_id) ? $data->sppg_id : null;
$user_id = isset($data->user_id) ? $data->user_id : null;

if (!$role) {
    echo json_encode(["status" => "error", "message" => "Role required"]);
    exit();
}

try {
    if ($role === 'sekolah') {
        if (!$sekolah_id) {
            echo json_encode(["status" => "error", "message" => "Sekolah ID required"]);
            exit();
        }
        $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE role = 'sekolah' AND sekolah_id = ? AND is_read = 0");
        $stmt->execute([$sekolah_id]);
    } else if ($role === 'sppg') {
        $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE role = 'sppg' AND is_read = 0");
        $stmt->execute();
    } else if ($role === 'kantin') {
        if (!$user_id) {
            echo json_encode(["status" => "error", "message" => "User ID required"]);
            exit();
        }
        $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE role = 'kantin' AND user_id = ? AND is_read = 0");
        $stmt->execute([$user_id]);
    }

    echo json_encode(["status" => "success", "message" => "Notifications marked as read"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
