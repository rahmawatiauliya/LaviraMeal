<?php
include_once __DIR__ . '/../shared/config.php';

// Ambil sekolah_id dari params atau session
$sekolah_id = isset($_GET['sekolah_id']) ? $_GET['sekolah_id'] : null;

if (!$sekolah_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Sekolah ID diperlukan"]);
    exit();
}

try {
    // Karena tabel 'kelas' mungkin belum ada secara explisit, kita asumsikan 
    // kelas diambil dari data unik siswa yang terdaftar di sekolah tersebut
    $query = "
        SELECT kelas, COUNT(id) as jumlah_siswa 
        FROM siswa 
        WHERE sekolah_id = ? 
        GROUP BY kelas 
        ORDER BY kelas ASC
    ";
    $stmt = $db->prepare($query);
    $stmt->execute([$sekolah_id]);
    $list_kelas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $list_kelas
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
