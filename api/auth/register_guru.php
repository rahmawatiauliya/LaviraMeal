<?php
include_once __DIR__ . '/../shared/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    $nama = !empty($data->nama_lengkap) ? $data->nama_lengkap : '';
    $nip = !empty($data->nip) ? $data->nip : '';
    $hp = !empty($data->no_hp) ? $data->no_hp : '';
    $email = !empty($data->email) ? $data->email : '';
    $npsn = !empty($data->sekolah_npsn) ? $data->sekolah_npsn : '';
    $nama_sekolah = !empty($data->nama_sekolah) ? $data->nama_sekolah : '';
    $kode_undangan = !empty($data->kode_undangan) ? $data->kode_undangan : '';
    $mapel = !empty($data->mata_pelajaran) ? $data->mata_pelajaran : '';
    $kelas = !empty($data->kelas_diampu) ? $data->kelas_diampu : '';
    $username = !empty($data->username) ? $data->username : '';
    $pass = !empty($data->password) ? $data->password : '';
    $role = 'guru';

    if (!empty($nama) && !empty($email) && !empty($pass)) {
        
        // 1. Cek email di DB
        $stmtCheckEmail = $db->prepare("SELECT id, sppg_id FROM users WHERE email = :email");
        $stmtCheckEmail->execute([':email' => $email]);
        if ($stmtCheckEmail->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Email sudah terdaftar"]);
            exit;
        }

        // 1b. Cek username di DB
        if (!empty($username)) {
            $stmtCheckUser = $db->prepare("SELECT id FROM users WHERE username = :username");
            $stmtCheckUser->execute([':username' => $username]);
            if ($stmtCheckUser->rowCount() > 0) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Username sudah digunakan"]);
                exit;
            }
        }

        // 2. Cari sekolah_id berdasarkan NPSN
        $sekolah_id = null;
        if (!empty($npsn)) {
            $stmtSekolah = $db->prepare("SELECT id FROM sekolah WHERE npsn = :npsn LIMIT 1");
            $stmtSekolah->execute([':npsn' => $npsn]);
            $sekolah = $stmtSekolah->fetch();
            if ($sekolah) {
                $sekolah_id = $sekolah['id'];
            }
        }

        try {
            $db->beginTransaction();

            $password_hash = password_hash($pass, PASSWORD_BCRYPT);
            
            // Username default jika kosong (backwards compatibility or safety)
            if (empty($username)) {
                $username = explode('@', $email)[0] . rand(10, 99);
            }

            // 2. Insert into users
            $query = "INSERT INTO users (id, nama, username, email, password_hash, role, is_active) 
                      VALUES (UUID(), :nama, :username, :email, :password_hash, :role, 1)"; // 1 = Aktif Otomatis

            $stmt = $db->prepare($query);
            $stmt->execute([
                ':nama' => $nama,
                ':username' => $username,
                ':email' => $email,
                ':password_hash' => $password_hash,
                ':role' => $role
            ]);

            // Ambil ID
            $stmtId = $db->prepare("SELECT id FROM users WHERE email = :email");
            $stmtId->execute([':email' => $email]);
            $user = $stmtId->fetch();
            $user_id = $user['id'];

            // 3. Insert into guru

            $sqlGuru = "INSERT INTO guru (id, user_id, nip, no_hp, sekolah_id, kode_undangan, mata_pelajaran, kelas_diampu, status_verifikasi) 
                        VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, 'approved')";
            $stmtGuru = $db->prepare($sqlGuru);
            $stmtGuru->execute([$user_id, $nip, $hp, $sekolah_id, $kode_undangan, $mapel, $kelas]);

            $db->commit();
            echo json_encode(["status" => "success", "message" => "Pendaftaran Guru berhasil. Akun Anda sudah aktif dan dapat langsung digunakan."]);

        }
        catch (Exception $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Gagal: " . $e->getMessage()]);
        }
    }
    else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Data wajib tidak lengkap"]);
    }
}
?>
