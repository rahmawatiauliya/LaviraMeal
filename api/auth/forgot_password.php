<?php
include_once __DIR__ . '/../shared/config.php';

// Buat tabel password_reset_codes jika belum ada (untuk kemudahan setup)
try {
    $db->exec("CREATE TABLE IF NOT EXISTS password_reset_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(150) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
} catch (Exception $e) {
    // Abaikan jika error
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $action = !empty($data->action) ? $data->action : '';

    if ($action == 'send_otp') {
        $email = !empty($data->email) ? $data->email : '';
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Format email tidak valid"]);
            exit;
        }

        // Cek apakah email ada di tabel users
        $stmtUser = $db->prepare("SELECT id FROM users WHERE email = :email");
        $stmtUser->execute([':email' => $email]);
        if ($stmtUser->rowCount() == 0) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Email tidak terdaftar"]);
            exit;
        }

        // Generate 6-digit OTP
        $otp = sprintf("%06d", mt_rand(1, 999999));
        $expires_at = date('Y-m-d H:i:s', strtotime('+15 minutes'));

        // Simpan ke DB
        $stmt = $db->prepare("INSERT INTO password_reset_codes (email, code, expires_at) VALUES (:email, :code, :expires_at)");
        $stmt->execute([
            ':email' => $email,
            ':code' => $otp,
            ':expires_at' => $expires_at
        ]);

        // Karena ini lingkungan development tanpa server SMTP, kita return kodenya agar bisa dites
        echo json_encode([
            "status" => "success", 
            "message" => "Kode OTP telah dikirim ke email " . $email,
            "debug_otp" => $otp // Hapus ini di produksi
        ]);

    } else if ($action == 'verify_otp') {
        $email = !empty($data->email) ? $data->email : '';
        $code = !empty($data->code) ? $data->code : '';

        if (empty($email) || empty($code)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
            exit;
        }

        // Verifikasi OTP
        $stmt = $db->prepare("SELECT id FROM password_reset_codes WHERE email = :email AND code = :code AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1");
        $stmt->execute([':email' => $email, ':code' => $code]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(["status" => "success", "message" => "OTP valid"]);
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "OTP tidak valid atau sudah kedaluwarsa"]);
        }

    } else if ($action == 'reset_password') {
        $email = !empty($data->email) ? $data->email : '';
        $code = !empty($data->code) ? $data->code : '';
        $new_password = !empty($data->new_password) ? $data->new_password : '';

        if (empty($email) || empty($code) || empty($new_password)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
            exit;
        }

        // Verifikasi OTP sekali lagi sebelum reset
        $stmt = $db->prepare("SELECT id FROM password_reset_codes WHERE email = :email AND code = :code AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1");
        $stmt->execute([':email' => $email, ':code' => $code]);

        if ($stmt->rowCount() > 0) {
            $password_hash = password_hash($new_password, PASSWORD_BCRYPT);
            $stmtUpdate = $db->prepare("UPDATE users SET password_hash = :password_hash WHERE email = :email");
            $stmtUpdate->execute([':password_hash' => $password_hash, ':email' => $email]);

            // Hapus OTP yang sudah dipakai
            $db->prepare("DELETE FROM password_reset_codes WHERE email = :email")->execute([':email' => $email]);

            echo json_encode(["status" => "success", "message" => "Kata sandi berhasil diperbarui"]);
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Permintaan tidak valid"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Aksi tidak dikenal"]);
    }
}
?>
