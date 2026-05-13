<?php
include_once __DIR__ . '/../shared/config.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['sppg_id']) || !isset($data['sekolah_id']) || !isset($data['nominal'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit();
}

try {
    $db->beginTransaction();
    
    $trx_id = 'TRX-' . date('YmdHis') . rand(100,999);
    
    $query = "INSERT INTO transaksi_dana (id, sppg_id, sekolah_id, nominal, metode, status) VALUES (?, ?, ?, ?, 'Transfer', 'Berhasil')";
    $stmt = $db->prepare($query);
    $stmt->execute([$trx_id, $data['sppg_id'], $data['sekolah_id'], $data['nominal']]);
    
    // UPDATE SALDO SEKOLAH
    $updateQuery = "UPDATE sekolah SET saldo = saldo + ? WHERE id = ?";
    $stmtUpdate = $db->prepare($updateQuery);
    $stmtUpdate->execute([$data['nominal'], $data['sekolah_id']]);
    
    $db->commit();
    
    echo json_encode(['status' => 'success', 'message' => 'Point berhasil dikirim', 'trx_id' => $trx_id]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
