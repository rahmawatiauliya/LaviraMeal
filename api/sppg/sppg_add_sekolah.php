<?php
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__ . '/../shared/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (
        !empty($data->nama_sekolah) &&
        !empty($data->npsn) &&
        !empty($data->username) &&
        !empty($data->email) &&
        !empty($data->password) &&
        !empty($data->alamat)
    ) {
        try {
            $db->beginTransaction();

            // Cek apakah email sudah terdaftar
            $stmt = $db->prepare("SELECT id FROM users WHERE email = :email");
            $stmt->execute([':email' => $data->email]);
            if ($stmt->rowCount() > 0) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Email sudah digunakan oleh akun lain."]);
                $db->rollBack();
                exit();
            }

            // Cek apakah username sudah terdaftar
            $stmt = $db->prepare("SELECT id FROM users WHERE username = :username");
            $stmt->execute([':username' => $data->username]);
            if ($stmt->rowCount() > 0) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Username sudah digunakan oleh akun lain."]);
                $db->rollBack();
                exit();
            }

            // Fungsi helper generate UUID sederhana (karena fungsi bawaan UUID MySQL versi tertentu agak ribet)
            function gen_uuid() {
                return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                    mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                    mt_rand(0, 0xffff),
                    mt_rand(0, 0x0fff) | 0x4000,
                    mt_rand(0, 0x3fff) | 0x8000,
                    mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
                );
            }

            // SPPG ID - Sekarang diambil dari request aplikasi
            $sppg_id = !empty($data->sppg_id) ? $data->sppg_id : null;

            if (!$sppg_id) {
                throw new Exception("ID SPPG tidak valid atau kosong.");
            }

            $user_id = gen_uuid();
            $sekolah_id = gen_uuid();

            // 1. Insert tabel Users (Set sekolah_id NULL dulu untuk menghindari FK error)
            $hash = password_hash($data->password, PASSWORD_DEFAULT);
            $queryUser = "INSERT INTO users (id, nama, username, email, password_hash, role, sppg_id) 
                          VALUES (:id, :nama, :username, :email, :password_hash, 'sekolah', :sppg_id)";
            $stmtUser = $db->prepare($queryUser);
            $stmtUser->execute([
                ':id' => $user_id,
                ':nama' => 'Admin ' . $data->nama_sekolah,
                ':username' => $data->username,
                ':email' => $data->email,
                ':password_hash' => $hash,
                ':sppg_id' => $sppg_id
            ]);

            // 2. Insert tabel Sekolah
            $querySekolah = "INSERT INTO sekolah (id, user_id, sppg_id, nama_sekolah, npsn, jenjang, alamat) 
                             VALUES (:id, :user_id, :sppg_id, :nama_sekolah, :npsn, 'SD', :alamat)";
            $stmtSekolah = $db->prepare($querySekolah);
            $stmtSekolah->execute([
                ':id' => $sekolah_id,
                ':user_id' => $user_id,
                ':sppg_id' => $sppg_id,
                ':nama_sekolah' => $data->nama_sekolah,
                ':npsn' => $data->npsn,
                ':alamat' => $data->alamat
            ]);

            // 3. Update tabel Users untuk menyambungkan ke sekolah_id yang baru dibuat
            $updateUser = "UPDATE users SET sekolah_id = :sekolah_id WHERE id = :user_id";
            $db->prepare($updateUser)->execute([
                ':sekolah_id' => $sekolah_id,
                ':user_id' => $user_id
            ]);

            $db->commit();

            http_response_code(200);
            echo json_encode([
                "status" => "success",
                "message" => "Akun sekolah berhasil didaftarkan!"
            ]);

        } catch (Exception $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Kesalahan: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Data tidak lengkap. Pastikan semua form terisi."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>
