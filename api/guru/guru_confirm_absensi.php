<?php
include_once __DIR__ . '/../shared/config.php';

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

$user_id = !empty($data->user_id) ? $data->user_id : '';
$jadwal_id = !empty($data->jadwal_id) ? $data->jadwal_id : '';
$menu_id = !empty($data->menu_id) ? $data->menu_id : '';
$absensi_data = !empty($data->absensi_data) ? $data->absensi_data : [];

if (!$user_id || !$jadwal_id || empty($absensi_data)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
    exit();
}

try {
    $db->beginTransaction();

    foreach ($absensi_data as $row) {
        $siswa_id = $row->siswa_id;
        $hadir = $row->hadir ? 1 : 0;
        $makan = $row->makan ? 1 : 0;
        $catatan = !empty($row->catatan) ? $row->catatan : null;

        // Cek apakah data konsumsi sudah ada untuk siswa ini di jadwal ini
        $stmtCheck = $db->prepare("SELECT id FROM konsumsi_siswa WHERE siswa_id = ? AND jadwal_id = ?");
        $stmtCheck->execute([$siswa_id, $jadwal_id]);
        $existing = $stmtCheck->fetch();

        if ($existing) {
            // Update
            $stmtUpdate = $db->prepare("UPDATE konsumsi_siswa SET 
                                        hadir = ?, 
                                        makan = ?, 
                                        catatan = ?, 
                                        dicatat_oleh = ?,
                                        menu_id = ?
                                        WHERE id = ?");
            $stmtUpdate->execute([$hadir, $makan, $catatan, $user_id, $menu_id, $existing['id']]);
        } else {
            // Insert
            $id = bin2hex(random_bytes(16));
            $stmtInsert = $db->prepare("INSERT INTO konsumsi_siswa (id, siswa_id, jadwal_id, menu_id, dicatat_oleh, hadir, makan, catatan) 
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmtInsert->execute([$id, $siswa_id, $jadwal_id, $menu_id, $user_id, $hadir, $makan, $catatan]);
        }
    }

    $db->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Data absensi dan konsumsi berhasil disimpan"
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
