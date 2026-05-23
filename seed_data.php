<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");

try {
    $db->exec("SET FOREIGN_KEY_CHECKS = 0");
    
    // 1. Bersihkan tabel terkait user untuk fresh start (Opsional, tapi aman untuk seed)
    $db->exec("TRUNCATE TABLE users");
    $db->exec("TRUNCATE TABLE sppg");
    $db->exec("TRUNCATE TABLE sekolah");
    $db->exec("TRUNCATE TABLE siswa");
    $db->exec("TRUNCATE TABLE guru");
    $db->exec("TRUNCATE TABLE kantin");

    echo "Tables truncated for fresh seed.\n";

    // 2. Buat SPPG
    $sppg_id = "sppg-karawang-01";
    $sppg_user_id = "user-sppg-01";
    
    $db->prepare("INSERT INTO sppg (id, user_id, nama_lembaga, kode_sppg, kota, provinsi) VALUES (?, ?, ?, ?, ?, ?)")
       ->execute([$sppg_id, $sppg_user_id, "SPPG Karawang Pusat", "SPPG-KRW-001", "Karawang", "Jawa Barat"]);

    // 3. Buat Sekolah
    $sekolah_id = "sekolah-smkn1-01";
    $sekolah_user_id = "user-sekolah-01";
    $db->prepare("INSERT INTO sekolah (id, user_id, sppg_id, nama_sekolah, npsn, jenjang, kota, provinsi) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
       ->execute([$sekolah_id, $sekolah_user_id, $sppg_id, "SMKN 1 Karawang", "12345678", "SMK", "Karawang", "Jawa Barat"]);

    // 4. Buat Users
    $pass = password_hash("password123", PASSWORD_DEFAULT);
    
    // User SPPG (Super Admin)
    $db->prepare("INSERT INTO users (id, nama, username, email, password_hash, role, sppg_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)")
       ->execute([$sppg_user_id, "Admin SPPG", "adminsppg", "sppg@lavirameal.com", $pass, "sppg", $sppg_id]);

    // User Sekolah (Admin Sekolah)
    $db->prepare("INSERT INTO users (id, nama, username, email, password_hash, role, sekolah_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)")
       ->execute([$sekolah_user_id, "Admin Sekolah", "adminsekolah", "sekolah@lavirameal.com", $pass, "sekolah", $sekolah_id]);

    // User Siswa
    $siswa_user_id = "user-siswa-01";
    $siswa_id = "siswa-01";
    $db->prepare("INSERT INTO users (id, nama, username, email, password_hash, role, sekolah_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)")
       ->execute([$siswa_user_id, "Budi Santoso", "budi", "budi@student.com", $pass, "siswa", $sekolah_id]);
    
    $db->prepare("INSERT INTO siswa (id, user_id, sekolah_id, nis, nama, kelas, saldo) VALUES (?, ?, ?, ?, ?, ?, ?)")
       ->execute([$siswa_id, $siswa_user_id, $sekolah_id, "2024001", "Budi Santoso", "XII RPL 1", 50000]);

    $db->exec("SET FOREIGN_KEY_CHECKS = 1");

    echo "\nSEED SUCCESSFUL!\n";
    echo "-----------------------------------\n";
    echo "Login Admin SPPG: adminsppg / password123\n";
    echo "Login Admin Sekolah: adminsekolah / password123\n";
    echo "Login Siswa: budi / password123\n";
    echo "-----------------------------------\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
