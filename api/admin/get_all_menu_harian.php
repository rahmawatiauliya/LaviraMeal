<?php
header("Content-Type: application/json");
include_once __DIR__ . '/../shared/config.php';

$sekolah_id = $_GET['sekolah_id'] ?? null; // Optional: filter by school

try {
    $query = "SELECT m.*, k.nama_kantin, s.nama_sekolah 
              FROM menu_harian m
              JOIN kantin k ON m.kantin_id = k.id
              JOIN sekolah s ON k.sekolah_id = s.id";
    
    if ($sekolah_id) {
        $query .= " WHERE k.sekolah_id = :sid";
    }
    
    $query .= " ORDER BY m.tanggal DESC, m.created_at DESC LIMIT 50";
    
    $stmt = $db->prepare($query);
    if ($sekolah_id) {
        $stmt->bindParam(':sid', $sekolah_id);
    }
    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $data
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
