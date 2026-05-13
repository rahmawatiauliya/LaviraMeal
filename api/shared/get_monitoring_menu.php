<?php
include_once __DIR__ . '/config.php';
header("Content-Type: application/json");

// Input: tanggal (optional), sekolah_id (optional, for admin sekolah)
$tanggal = isset($_GET['tanggal']) ? $_GET['tanggal'] : date('Y-m-d');
$sekolah_id = isset($_GET['sekolah_id']) ? $_GET['sekolah_id'] : null;

try {
    // Query untuk mengambil semua kantin yang aktif
    // Jika ada sekolah_id, filter berdasarkan sekolah tersebut
    $query_kantin = "SELECT k.id, k.nama_kantin, k.sekolah_id, s.nama_sekolah 
                    FROM kantin k 
                    JOIN sekolah s ON k.sekolah_id = s.id 
                    WHERE k.is_aktif = 1";
    
    $params_kantin = [];
    if ($sekolah_id) {
        $query_kantin .= " AND k.sekolah_id = ?";
        $params_kantin[] = $sekolah_id;
    }

    $stmt_kantin = $db->prepare($query_kantin);
    $stmt_kantin->execute($params_kantin);
    $list_kantin = $stmt_kantin->fetchAll(PDO::FETCH_ASSOC);

    $results = [];
    foreach ($list_kantin as $kantin) {
        // Cek apakah sudah posting pada tanggal tersebut
        $stmt_post = $db->prepare("SELECT id, menu_name, created_at, status 
                                  FROM menu_kantin 
                                  WHERE kantin_id = ? AND tanggal = ? 
                                  ORDER BY created_at DESC LIMIT 1");
        $stmt_post->execute([$kantin['id'], $tanggal]);
        $post = $stmt_post->fetch(PDO::FETCH_ASSOC);

        $results[] = [
            "kantin_id" => $kantin['id'],
            "nama_kantin" => $kantin['nama_kantin'],
            "sekolah_id" => $kantin['sekolah_id'],
            "nama_sekolah" => $kantin['nama_sekolah'],
            "sudah_posting" => $post ? true : false,
            "post_id" => $post ? $post['id'] : null,
            "menu_name" => $post ? $post['menu_name'] : null,
            "waktu_posting" => $post ? date('H:i', strtotime($post['created_at'])) : null,
            "status_approval" => $post ? $post['status'] : null
        ];
    }

    echo json_encode([
        "status" => "success",
        "tanggal" => $tanggal,
        "data" => $results
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
