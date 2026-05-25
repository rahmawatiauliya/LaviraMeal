<?php
include_once __DIR__ . '/config.php';
header("Content-Type: application/json");

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
$sekolah_id = isset($_GET['sekolah_id']) ? $_GET['sekolah_id'] : null;

try {
    if (!$sekolah_id && $user_id) {
        // Cari dari siswa
        $stmt = $db->prepare("SELECT sekolah_id FROM siswa WHERE user_id = ? OR id = ?");
        $stmt->execute([$user_id, $user_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $sekolah_id = $row['sekolah_id'];
        } else {
            // Cari dari guru
            $stmt = $db->prepare("SELECT sekolah_id FROM guru WHERE user_id = ? OR id = ?");
            $stmt->execute([$user_id, $user_id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $sekolah_id = $row['sekolah_id'];
            }
        }
    }

    if ($sekolah_id) {
        $stmt = $db->prepare("SELECT id, nama_kantin, pemilik, foto_kantin, no_telp FROM kantin WHERE sekolah_id = ? AND is_aktif = 1");
        $stmt->execute([$sekolah_id]);
    } else {
        // Fallback to all active canteens
        $stmt = $db->prepare("SELECT id, nama_kantin, pemilik, foto_kantin, no_telp FROM kantin WHERE is_aktif = 1");
        $stmt->execute();
    }
    $canteens = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "canteens" => $canteens
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
