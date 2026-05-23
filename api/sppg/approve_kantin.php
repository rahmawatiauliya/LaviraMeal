<?php
header("Content-Type: application/json");
include_once __DIR__ . '/../shared/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!empty($data->user_id)) {
        $action = $data->action ?? 'approved'; // approved or rejected
        $notes = $data->notes ?? '';

        try {
            $db->beginTransaction();

            // 1. Update status_sppg dan catatan_sppg di tabel kantin
            $query = "UPDATE kantin SET status_sppg = :action, catatan_sppg = :notes WHERE user_id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':action', $action);
            $stmt->bindParam(':notes', $notes);
            $stmt->bindParam(':id', $data->user_id);
            $stmt->execute();
            
            if ($action === 'approved') {
                // 2. Cek apakah sudah disetujui juga oleh Sekolah
                $check = $db->prepare("SELECT status_sekolah FROM kantin WHERE user_id = :id");
                $check->bindParam(':id', $data->user_id);
                $check->execute();
                $kantin = $check->fetch(PDO::FETCH_ASSOC);

                if ($kantin && $kantin['status_sekolah'] === 'approved') {
                    // Keduanya sudah setuju, aktifkan akun!
                    $db->prepare("UPDATE kantin SET is_aktif = 1 WHERE user_id = ?")->execute([$data->user_id]);
                    $db->prepare("UPDATE users SET is_active = 1 WHERE id = ?")->execute([$data->user_id]);
                    $msg = "Kantin berhasil disetujui SPPG. Status: AKTIF.";
                } else {
                    $msg = "Kantin berhasil disetujui SPPG. Menunggu persetujuan Admin Sekolah.";
                }
            } else {
                // Jika rejected, pastikan is_active = 0
                $db->prepare("UPDATE users SET is_active = 0 WHERE id = ?")->execute([$data->user_id]);
                $msg = "Kantin berhasil ditolak (Rejected) oleh SPPG.";
            }

            $db->commit();
            echo json_encode(["status" => "success", "message" => $msg]);

        } catch (PDOException $e) {
            if ($db->inTransaction()) $db->rollBack();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "User ID tidak boleh kosong."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>
