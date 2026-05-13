<?php
include_once __DIR__ . '/../shared/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    $nama = !empty($data->nama_lengkap) ? $data->nama_lengkap : (!empty($data->nama) ? $data->nama : '');
    $username = !empty($data->username) ? $data->username : '';
    $email = !empty($data->email) ? $data->email : '';
    $pass = !empty($data->password) ? $data->password : '';
    $role = !empty($data->role) ? $data->role : '';

    if (!empty($nama) && !empty($username) && !empty($email) && !empty($pass) && !empty($role)) {
        
        // Validasi format email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Format email tidak valid"]);
            exit;
        }

        // 1. Cek email/username di DB
        $stmtCheckEmail = $db->prepare("SELECT id FROM users WHERE email = :email");
        $stmtCheckEmail->execute([':email' => $email]);
        if ($stmtCheckEmail->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Email sudah terdaftar"]);
            exit;
        }

        $stmtCheckUsername = $db->prepare("SELECT id FROM users WHERE username = :username");
        $stmtCheckUsername->execute([':username' => $username]);
        if ($stmtCheckUsername->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Username sudah terdaftar"]);
            exit;
        }

        try {
            $db->beginTransaction();

            // 2. Hash password
            // Kita pakai password_hash default PHP, menyesuaikan db tapi di gambar disebut bisa pakai MD5 
            $password_hash = password_hash($pass, PASSWORD_BCRYPT);

            // 3. Insert user SPPG dengan UUID eksplisit untuk menghindari duplicate entry PRIMARY KEY jika default db tidak jalan
            // Jika role kantin, set is_active = FALSE (menunggu ACC)
            $is_active = 1; // Aktif Otomatis (Tidak perlu verifikasi pusat)
            
            $query = "INSERT INTO users (id, nama, username, email, password_hash, role, is_active) 
                      VALUES (UUID(), :nama, :username, :email, :password_hash, :role, :is_active)";

            $stmt = $db->prepare($query);
            $stmt->execute([
                ':nama' => $nama,
                ':username' => $username,
                ':email' => $email,
                ':password_hash' => $password_hash,
                ':role' => $role,
                ':is_active' => $is_active
            ]);

            // Ambil ID yang baru dibuat (karena UUID, kita ambil berdasarkan username)
            $stmtId = $db->prepare("SELECT id FROM users WHERE username = :username");
            $stmtId->execute([':username' => $username]);
            $user = $stmtId->fetch();
            $last_id = $user['id'];

            // 4. Spesifik SPPG
            // Karena ini khusus SPPG, kita masukkan ke tabel SPPG agar tidak error foreign key kalau dibutuhkan
            if ($role === 'sppg') {
                $kodeUnik = 'SPPG-' . strtoupper(substr(md5(uniqid()), 0, 5)); // Generate kode acak
                $sql = "INSERT INTO sppg (id, user_id, nama_lembaga, kode_sppg, alamat) VALUES (UUID(), ?, ?, ?, ?)";
                $db->prepare($sql)->execute([$last_id, $nama, $kodeUnik, '-']);
            }

            $db->commit();
            echo json_encode(["status" => "success", "message" => "Registrasi berhasil"]);

        }
        catch (Exception $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Gagal: " . $e->getMessage()]);
        }
    }
    else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
    }
}
?>
