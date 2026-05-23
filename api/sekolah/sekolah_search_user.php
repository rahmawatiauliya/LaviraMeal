<?php
include_once __DIR__ . '/../shared/config.php';

// Endpoint untuk mencari siswa atau guru berdasarkan nama/nis/nip
// Query params: sekolah_id, search, role (siswa/guru)

$sekolah_id = $_GET['sekolah_id'] ?? null;
$search = $_GET['search'] ?? '';
$role = $_GET['role'] ?? 'siswa';

if (!$sekolah_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Sekolah ID diperlukan"]);
    exit();
}

try {
    // Pastikan kolom saldo ada
    try { $db->query("SELECT saldo FROM siswa LIMIT 1"); } catch (Exception $e) { $db->exec("ALTER TABLE siswa ADD COLUMN saldo DECIMAL(15,2) DEFAULT 0"); }
    try { $db->query("SELECT saldo FROM guru LIMIT 1"); } catch (Exception $e) { $db->exec("ALTER TABLE guru ADD COLUMN saldo DECIMAL(15,2) DEFAULT 0"); }

    if ($role === 'siswa') {
        $query = "SELECT id, nama, nis as identitas, kelas as info, saldo FROM siswa 
                  WHERE sekolah_id = ? AND (nama LIKE ? OR nis LIKE ?) 
                  ORDER BY nama ASC LIMIT 20";
        $stmt = $db->prepare($query);
        $stmt->execute([$sekolah_id, "%$search%", "%$search%"]);
    } else {
        $query = "SELECT id, nama, nip as identitas, mata_pelajaran as info, COALESCE(saldo, 0) as saldo FROM guru 
                  WHERE sekolah_id = ? AND (nama LIKE ? OR nip LIKE ?) 
                  ORDER BY nama ASC LIMIT 20";
        $stmt = $db->prepare($query);
        $stmt->execute([$sekolah_id, "%$search%", "%$search%"]);
    }
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $results
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
