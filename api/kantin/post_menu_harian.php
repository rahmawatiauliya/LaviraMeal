<?php
header("Content-Type: application/json");
include_once __DIR__ . '/../shared/config.php';
include_once __DIR__ . '/../shared/notifications_helper.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $kantin_id = $_POST['kantin_id'] ?? '';
    $nama_menu = $_POST['nama_menu'] ?? '';
    $deskripsi = $_POST['deskripsi'] ?? '';
    $tanggal = $_POST['tanggal'] ?? date('Y-m-d');

    if (empty($kantin_id) || empty($nama_menu)) {
        echo json_encode(["status" => "error", "message" => "Kantin ID dan Nama Menu wajib diisi."]);
        exit;
    }

    try {
        // Handle Upload Foto Menu
        $target_dir = "../../uploads/menu_harian/";
        if (!file_exists($target_dir)) mkdir($target_dir, 0777, true);

        $foto_menu_path = null;
        if (isset($_FILES['foto_menu']) && !empty($_FILES['foto_menu']['name'])) {
            $ext = pathinfo($_FILES['foto_menu']['name'], PATHINFO_EXTENSION);
            if (empty($ext)) {
                $ext = 'jpg';
            }
            $name = "daily_" . time() . "_" . uniqid() . "." . $ext;
            if (move_uploaded_file($_FILES['foto_menu']['tmp_name'], $target_dir . $name)) {
                $foto_menu_path = "uploads/menu_harian/" . $name;
            }
        }

        $id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000, mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff));

        $stmt = $db->prepare("INSERT INTO menu_harian (id, kantin_id, tanggal, nama_menu, deskripsi, foto_menu) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $kantin_id, $tanggal, $nama_menu, $deskripsi, $foto_menu_path]);

        // Ambil info kantin & sekolah_id untuk notifikasi
        $stInfo = $db->prepare("SELECT k.nama_kantin, k.sekolah_id FROM kantin k WHERE k.id = ?");
        $stInfo->execute([$kantin_id]);
        $kantinInfo = $stInfo->fetch(PDO::FETCH_ASSOC);

        if ($kantinInfo) {
            createNotification($db, "Menu Harian Baru", "Kantin " . $kantinInfo['nama_kantin'] . " memposting menu baru: $nama_menu", "menu_harian", "sppg");
            createNotification($db, "Menu Harian Baru", "Kantin " . $kantinInfo['nama_kantin'] . " memposting menu baru: $nama_menu", "menu_harian", "sekolah", $kantinInfo['sekolah_id']);
        }

        echo json_encode([
            "status" => "success",
            "message" => "Menu harian berhasil diposting.",
            "menu_id" => $id
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Gagal memposting menu: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>
