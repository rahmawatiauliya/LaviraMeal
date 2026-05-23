<?php
header("Content-Type: application/json");
include_once __DIR__ . '/../shared/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    try {
        // Ambil data kantin yang belum disetujui SPPG
        $query = "SELECT u.id as user_id, u.nama as pemilik, u.nama as pengelola, u.username, u.email, 
                         k.id as id, k.id as kantin_id, k.nama_kantin, k.foto_kantin, k.foto_menu, k.npsn_sekolah,
                         'Menunggu Verifikasi' as status, k.created_at,
                         s.nama_sekolah as sekolah,
                         (CASE WHEN k.status_sekolah = 'approved' THEN 1 ELSE 0 END) as verified_by_school,
                         (CASE WHEN k.status_sppg = 'approved' THEN 1 ELSE 0 END) as verified_by_sppg
                  FROM users u 
                  JOIN kantin k ON u.id = k.user_id
                  LEFT JOIN sekolah s ON k.npsn_sekolah = s.npsn
                  WHERE u.role = 'kantin' AND k.status_sppg = 'pending'
                  ORDER BY k.created_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "data" => $users
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>
