<?php
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__ . '/../shared/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->sekolah_id) || !isset($data->amount) || !isset($data->quota)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
    exit();
}

try {
    $db->beginTransaction();

    // Deactivate previous ones
    $stmtCheck = $db->prepare("UPDATE dana_kaget SET is_active = 0 WHERE sekolah_id = :id");
    $stmtCheck->execute([':id' => $data->sekolah_id]);

    // Create new one
    $stmt = $db->prepare("INSERT INTO dana_kaget (sekolah_id, amount, quota) VALUES (:sekolah_id, :amount, :quota)");
    $stmt->execute([
        ':sekolah_id' => $data->sekolah_id,
        ':amount' => $data->amount,
        ':quota' => $data->quota
    ]);
    
    $danaId = $db->lastInsertId();
    $shareLink = "https://lavira.id/claim/" . base64_encode($danaId);

    // Log Activity
    $logStmt = $db->prepare("INSERT INTO activity_logs (sekolah_id, type, message, detail) VALUES (:sekolah_id, 'DANA_KAGET', 'Dana Kaget', :detail)");
    $logStmt->execute([
        ':sekolah_id' => $data->sekolah_id,
        ':detail' => "Membuat Dana Kaget sebesar " . number_format($data->amount) . " untuk " . $data->quota . " siswa."
    ]);

    $db->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Dana Kaget berhasil dibuat",
        "data" => [
            "id" => $danaId,
            "amount" => $data->amount,
            "quota" => $data->quota,
            "share_link" => $shareLink
        ]
    ]);

} catch (PDOException $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
