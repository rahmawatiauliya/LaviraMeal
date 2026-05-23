<?php
header("Content-Type: application/json");
include_once __DIR__ . '/../shared/config.php';

$sppg_id = isset($_GET['sppg_id']) ? $_GET['sppg_id'] : null;

if (!empty($sppg_id)) {
    try {
        $stmt = $db->prepare("
            SELECT 
                u.id as user_id, 
                u.nama as pemilik, 
                IF(k.pemilik = '' OR k.pemilik IS NULL, u.nama, k.pemilik) as pengelola, 
                u.username, 
                u.email,
                k.id as id, 
                k.id as kantin_id, 
                k.nama_kantin, 
                k.foto_kantin, 
                k.foto_menu, 
                k.npsn_sekolah,
                k.is_aktif, 
                k.created_at,
                s.nama_sekolah as sekolah,
                (CASE WHEN k.status_sekolah = 'approved' THEN 1 ELSE 0 END) as verified_by_school,
                (CASE WHEN k.status_sppg = 'approved' THEN 1 ELSE 0 END) as verified_by_sppg,
                (CASE WHEN k.status_sppg = 'pending' THEN 'Menunggu Verifikasi' WHEN k.status_sppg = 'approved' THEN 'Terverifikasi' ELSE 'Ditolak' END) as status
            FROM users u
            JOIN kantin k ON u.id = k.user_id
            JOIN sekolah s ON k.sekolah_id = s.id
            WHERE u.role = 'kantin' AND s.sppg_id = ?
            ORDER BY k.created_at DESC
        ");
        $stmt->execute([$sppg_id]);
        $kantin_list = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Tentukan base URL dinamis untuk image uploads
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $script_name = $_SERVER['SCRIPT_NAME'] ?? '';
        $project_folder = str_replace('/api/sppg/sppg_get_kantin.php', '', $script_name);
        if (empty($project_folder) || $project_folder === $script_name) {
            $project_folder = '/project_lavirameal';
        }
        $base_url = "$protocol://$host" . rtrim($project_folder, '/') . '/';

        // Petakan foto agar menjadi absolute URL jika berupa relative path
        $result = array_map(function ($k) use ($base_url) {
            if (!empty($k['foto_kantin']) && strpos($k['foto_kantin'], 'http') !== 0) {
                $k['foto_kantin'] = $base_url . $k['foto_kantin'];
            }
            if (!empty($k['foto_menu']) && strpos($k['foto_menu'], 'http') !== 0) {
                $k['foto_menu'] = $base_url . $k['foto_menu'];
            }
            return $k;
        }, $kantin_list);

        echo json_encode([
            "status" => "success",
            "data" => $result
        ]);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "SPPG ID tidak ditemukan"]);
}
?>

