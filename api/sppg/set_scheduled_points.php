<?php
include_once __DIR__ . '/../shared/config.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['sekolah_id']) || !isset($data['monthly_amount']) || !isset($data['distribution_day'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Sekolah ID, nominal bulanan, dan tanggal distribusi wajib diisi.']);
    exit();
}

try {
    $query = "INSERT INTO scheduled_points (sekolah_id, monthly_amount, distribution_day) 
              VALUES (:sid, :amt, :day) 
              ON DUPLICATE KEY UPDATE monthly_amount = :amt2, distribution_day = :day2";
              
    $stmt = $db->prepare($query);
    $stmt->execute([
        ':sid' => $data['sekolah_id'],
        ':amt' => $data['monthly_amount'],
        ':day' => $data['distribution_day'],
        ':amt2' => $data['monthly_amount'],
        ':day2' => $data['distribution_day']
    ]);

    echo json_encode([
        'status' => 'success', 
        'message' => 'Jadwal poin bulanan berhasil diperbarui.',
        'sekolah_id' => $data['sekolah_id'],
        'monthly_amount' => $data['monthly_amount']
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
