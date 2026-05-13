<?php
header("Content-Type: application/json");
include_once __DIR__ . '/../shared/config.php';

// Fungsi Generate UUID v4 (Karena MySQL butuh ID unik teks)
function gen_uuid()
{
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    // Validasi data minimal yang diperlukan
    if (!empty($data->nama_sekolah) && !empty($data->npsn) && !empty($data->email_admin) && !empty($data->sppg_id)) {

        $user_id = gen_uuid();
        $sekolah_id = gen_uuid();
        $password_hash = password_hash("sekolah123", PASSWORD_BCRYPT); // Password default

        try {
            $db->beginTransaction();

            // 1. Simpan ke tabel USERS (Untuk Login Admin Sekolah)
            $stmt1 = $db->prepare("INSERT INTO users (id, nama, email, password_hash, role, sekolah_id, sppg_id) 
                                   VALUES (?, ?, ?, ?, 'sekolah', ?, ?)");
            $stmt1->execute([$user_id, "Admin " . $data->nama_sekolah, $data->email_admin, $password_hash, $sekolah_id, $data->sppg_id]);

            // 2. Simpan ke tabel SEKOLAH (Data Profil Sekolah)
            $stmt2 = $db->prepare("INSERT INTO sekolah (id, user_id, sppg_id, nama_sekolah, npsn, jenjang, alamat) 
                                   VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt2->execute([$sekolah_id, $user_id, $data->sppg_id, $data->nama_sekolah, $data->npsn, $data->jenjang, $data->alamat]);

            $db->commit();
            echo json_encode(["status" => "success", "message" => "Sekolah berhasil didaftarkan di Karawang!"]);

        }
        catch (Exception $e) {
            $db->rollBack();
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }
    else {
        echo json_encode(["status" => "error", "message" => "Data tidak lengkap (Nama, NPSN, Email Admin, & SPPG ID wajib ada)."]);
    }
}
else {
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>
