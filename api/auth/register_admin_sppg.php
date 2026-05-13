<?php
// Pastikan tidak ada spasi atau output sebelum tag php
include_once __DIR__ . '/../shared/config.php';

// Header sudah dihandle oleh config.php, jadi tidak perlu ditulis ulang di sini
// agar tidak terjadi duplikasi header CORS yang menyebabkan Network Error

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!$data) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Format JSON tidak valid"]);
        exit;
    }

    $nama = !empty($data->nama) ? $data->nama : '';
    $nik = !empty($data->nik) ? $data->nik : '';
    $hp = !empty($data->hp) ? $data->hp : '';
    $email = !empty($data->email) ? $data->email : '';
    $pass = !empty($data->password) ? $data->password : '';
    $wilayah = !empty($data->wilayah) ? $data->wilayah : '';
    $username_req = !empty($data->username) ? $data->username : '';
    $role = 'sppg';

    if (empty($nama) || empty($email) || empty($pass) || empty($nik) || empty($wilayah) || empty($username_req)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Mohon lengkapi semua field yang tersedia."]);
        exit;
    }

    // 1. Cek email di DB
    $stmtCheckEmail = $db->prepare("SELECT id FROM users WHERE email = :email");
    $stmtCheckEmail->execute([':email' => $email]);
    if ($stmtCheckEmail->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Email ini sudah terdaftar sebelumnya."]);
        exit;
    }

    // 1b. Cek username di DB
    if (!empty($username_req)) {
        $stmtCheckUser = $db->prepare("SELECT id FROM users WHERE username = :username");
        $stmtCheckUser->execute([':username' => $username_req]);
        if ($stmtCheckUser->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Username ini sudah digunakan."]);
            exit;
        }
    }

    try {
        $db->beginTransaction();

        // Generate IDs
        $user_id = 'USR-' . strtoupper(substr(md5(uniqid(rand(), true)), 0, 8));
        $sppg_id = 'SPPG-' . strtoupper(substr(md5(uniqid(rand(), true)), 0, 8));

        $password_hash = password_hash($pass, PASSWORD_BCRYPT);
        
        if (!empty($username_req)) {
            $username = $username_req;
        } else {
            $username = strtolower(explode('@', $email)[0]) . '_sppg';
        }

        // 2. Insert into users (sppg_id diset NULL dulu untuk menghindari FK error)
        $query = "INSERT INTO users (id, nama, username, email, password_hash, role, sppg_id, is_active) 
                  VALUES (:id, :nama, :username, :email, :password_hash, :role, NULL, 1)";

        $stmt = $db->prepare($query);
        $stmt->execute([
            ':id' => $user_id,
            ':nama' => $nama,
            ':username' => $username,
            ':email' => $email,
            ':password_hash' => $password_hash,
            ':role' => $role
        ]);

        // 3. Insert into sppg

        $sqlSppg = "INSERT INTO sppg (id, user_id, nik, nama_lembaga, wilayah, kode_sppg, no_telp, email_lembaga, alamat) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmtSppg = $db->prepare($sqlSppg);
        $stmtSppg->execute([
            $sppg_id,
            $user_id,
            $nik,
            $nama, 
            $wilayah, 
            'SPPG-' . strtoupper(substr(uniqid(), -5)), 
            $hp,
            $email,
            '-'
        ]);

        // 4. Hubungkan User ke SPPG
        $stmtUpdate = $db->prepare("UPDATE users SET sppg_id = :sppg_id WHERE id = :user_id");
        $stmtUpdate->execute([':sppg_id' => $sppg_id, ':user_id' => $user_id]);

        $db->commit();
        echo json_encode(["status" => "success", "message" => "Registrasi Berhasil! Silakan masuk ke akun Anda."]);

    }
    catch (Exception $e) {
        if ($db->inTransaction()) $db->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Gagal menyimpan data: " . $e->getMessage()]);
    }
}
?>
