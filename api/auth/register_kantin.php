<?php
header("Content-Type: application/json");
include_once __DIR__ . '/../shared/config.php';
include_once __DIR__ . '/../shared/notifications_helper.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $nama_pemilik = $_POST['nama_pemilik'] ?? '';
    $email_pemilik = $_POST['email_pemilik'] ?? '';
    $nama_kantin = $_POST['nama_kantin'] ?? '';
    $wilayah_id = $_POST['wilayah_id'] ?? ''; 
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    if (empty($nama_pemilik) || empty($email_pemilik) || empty($nama_kantin) || empty($username) || empty($password)) {
        echo json_encode(["status" => "error", "message" => "Harap lengkapi semua data wajib."]);
        exit;
    }

    try {
        $db->beginTransaction();

        // 1. Cek Username/Email
        $check = $db->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $check->execute([$username, $email_pemilik]);
        if ($check->rowCount() > 0) {
            echo json_encode(["status" => "error", "message" => "Username atau Email sudah terdaftar."]);
            $db->rollBack();
            exit;
        }

        // 2. Handle Upload Foto Kantin & Menu
        $target_dir = "../../uploads/kantin/";
        if (!file_exists($target_dir)) mkdir($target_dir, 0777, true);

        $foto_kantin_path = null;
        if (isset($_FILES['foto_kantin'])) {
            $ext = pathinfo($_FILES['foto_kantin']['name'], PATHINFO_EXTENSION);
            $name = "kantin_" . time() . "_" . uniqid() . "." . $ext;
            if (move_uploaded_file($_FILES['foto_kantin']['tmp_name'], $target_dir . $name)) {
                $foto_kantin_path = "uploads/kantin/" . $name;
            }
        }

        $foto_menu_path = null;
        if (isset($_FILES['foto_menu'])) {
            $ext = pathinfo($_FILES['foto_menu']['name'], PATHINFO_EXTENSION);
            $name = "menu_" . time() . "_" . uniqid() . "." . $ext;
            if (move_uploaded_file($_FILES['foto_menu']['tmp_name'], $target_dir . $name)) {
                $foto_menu_path = "uploads/kantin/" . $name;
            }
        }

        // 3. Insert ke Tabel Users
        $pass_hash = password_hash($password, PASSWORD_DEFAULT);
        $user_id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000, mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff));
        
        $stmtUser = $db->prepare("INSERT INTO users (id, nama, username, email, password_hash, role, is_active, created_at) VALUES (?, ?, ?, ?, ?, 'kantin', 0, NOW())");
        $stmtUser->execute([$user_id, $nama_pemilik, $username, $email_pemilik, $pass_hash]);

        // 4. Cari sekolah_id berdasarkan NPSN (wilayah_id)
        $stmtSekolah = $db->prepare("SELECT id FROM sekolah WHERE npsn = ? OR id = ? LIMIT 1");
        $stmtSekolah->execute([$wilayah_id, $wilayah_id]);
        $sekolah = $stmtSekolah->fetch(PDO::FETCH_ASSOC);

        if (!$sekolah) {
            echo json_encode(["status" => "error", "message" => "Sekolah dengan NPSN/ID $wilayah_id tidak ditemukan."]);
            $db->rollBack();
            exit;
        }
        $real_sekolah_id = $sekolah['id'];

        // 5. Insert ke Tabel Kantin
        $kantin_id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000, mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff));
        
        $stmtKantin = $db->prepare("INSERT INTO kantin (id, user_id, sekolah_id, nama_kantin, foto_kantin, foto_menu, npsn_sekolah, status_sppg, status_sekolah, is_aktif, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', 0, NOW())");
        $stmtKantin->execute([$kantin_id, $user_id, $real_sekolah_id, $nama_kantin, $foto_kantin_path, $foto_menu_path, $wilayah_id]);

        $db->commit();

        // Kirim Notifikasi ke SPPG dan Admin Sekolah
        createNotification($db, "Pendaftaran Kantin Baru", "Kantin $nama_kantin telah mendaftar dan menunggu verifikasi.", "verifikasi_kantin", "sppg");
        createNotification($db, "Pendaftaran Kantin Baru", "Kantin $nama_kantin mendaftar di sekolah Anda. Silakan verifikasi.", "verifikasi_kantin", "sekolah", $real_sekolah_id);

        echo json_encode([
            "status" => "success", 
            "message" => "Registrasi Berhasil! Harap menunggu 1-2 hari kerja untuk proses verifikasi oleh Admin Sekolah dan SPPG. Silakan login kembali secara berkala untuk mengecek status akun Anda."
        ]);

    } catch (PDOException $e) {
        if ($db->inTransaction()) $db->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Gagal mendaftar: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>
