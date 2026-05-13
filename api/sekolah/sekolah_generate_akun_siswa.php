<?php
/**
 * API untuk menggenerasi akun login siswa secara otomatis berdasarkan data di tabel siswa.
 * Username: NIS
 * Password Default: siswa123
 * Role: siswa
 */

include_once __DIR__ . '/../shared/config.php';

// Hanya izinkan metode POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

// Ambil sekolah_id
$sekolah_id = isset($_REQUEST['sekolah_id']) ? $_REQUEST['sekolah_id'] : null;

if (!$sekolah_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Sekolah ID tidak ditemukan"]);
    exit();
}

try {
    // 1. Ambil semua siswa yang BELUM punya akun di tabel users
    // Kita filter berdasarkan username (NIS) yang belum ada di tabel users
    $querySiswa = "SELECT s.nama, s.nis, s.sekolah_id 
                   FROM siswa s 
                   WHERE s.sekolah_id = :sid 
                   AND s.nis NOT IN (SELECT username FROM users WHERE role = 'siswa')";
    
    $stmtSiswa = $db->prepare($querySiswa);
    $stmtSiswa->execute([':sid' => $sekolah_id]);
    $siswas = $stmtSiswa->fetchAll();

    if (count($siswas) === 0) {
        echo json_encode([
            "status" => "success", 
            "message" => "Semua siswa sudah memiliki akun.",
            "data" => ["generated" => 0]
        ]);
        exit();
    }

    // 2. Siapkan proses insert akun
    $password_default = password_hash("siswa123", PASSWORD_BCRYPT);
    $generatedCount = 0;
    
    // Gunakan UUID() untuk MariaDB/MySQL
    $stmtUser = $db->prepare("INSERT INTO users (id, nama, username, email, password_hash, role, sekolah_id, is_active) 
                              VALUES (UUID(), :nama, :username, :email, :password, 'siswa', :sekolah_id, 1)");

    foreach ($siswas as $s) {
        try {
            // Kita buat email placeholder unik: nis@school.lavira.com
            $email_placeholder = $s['nis'] . "@mbg.lavira.com";
            
            $stmtUser->execute([
                ':nama' => $s['nama'],
                ':username' => $s['nis'],
                ':email' => $email_placeholder,
                ':password' => $password_default,
                ':sekolah_id' => $s['sekolah_id']
            ]);
            $generatedCount++;
        } catch (Exception $e) {
            // Skip jika terjadi error (misal email duplikat secara tidak sengaja)
            continue;
        }
    }

    echo json_encode([
        "status" => "success",
        "message" => "Berhasil menggenerasi $generatedCount akun siswa baru.",
        "data" => [
            "generated" => $generatedCount,
            "default_password" => "siswa123"
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Terjadi kesalahan: " . $e->getMessage()]);
}
?>
