<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");

try {
    $stmt = $db->query("SELECT id, nama, username, email, password_hash, role, is_active FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "--- DETECTED USER ACCOUNTS IN DATABASE ---\n";
    foreach ($users as $u) {
        echo "Username: " . $u['username'] . " | Name: " . $u['nama'] . " | Role: " . $u['role'] . " | Active: " . $u['is_active'] . "\n";
        
        // Test common default passwords
        $pwd123_ok = password_verify("password123", $u['password_hash']) ? "YES" : "NO";
        $pwdSiswa123_ok = password_verify("siswa123", $u['password_hash']) ? "YES" : "NO";
        $pwdGuru123_ok = password_verify("guru123", $u['password_hash']) ? "YES" : "NO";
        $pwdNum18_ok = password_verify("12345678", $u['password_hash']) ? "YES" : "NO";
        $pwdUsername_ok = password_verify($u['username'], $u['password_hash']) ? "YES" : "NO";
        
        echo "  - Matches 'password123': $pwd123_ok\n";
        echo "  - Matches 'siswa123': $pwdSiswa123_ok\n";
        echo "  - Matches 'guru123': $pwdGuru123_ok\n";
        echo "  - Matches '12345678': $pwdNum18_ok\n";
        echo "  - Matches their own username/NIP: $pwdUsername_ok\n";
    }
    // 2. Count and list Siswa
    $stmtSiswa = $db->query("SELECT id, user_id, sekolah_id, nis, nama, kelas FROM siswa");
    $siswas = $stmtSiswa->fetchAll(PDO::FETCH_ASSOC);
    echo "\n--- SISWA IN DATABASE (" . count($siswas) . " total) ---\n";
    foreach ($siswas as $s) {
        echo "NIS: " . $s['nis'] . " | Name: " . $s['nama'] . " | Kelas: " . $s['kelas'] . " | SekolahID: " . $s['sekolah_id'] . "\n";
    }

    // 3. Count and list Guru
    $stmtGuru = $db->query("SELECT id, user_id, sekolah_id, nip, nama, mata_pelajaran, kelas_wali FROM guru");
    $gurus = $stmtGuru->fetchAll(PDO::FETCH_ASSOC);
    echo "\n--- GURU IN DATABASE (" . count($gurus) . " total) ---\n";
    foreach ($gurus as $g) {
        echo "NIP: " . $g['nip'] . " | Name: " . $g['nama'] . " | Mapel: " . $g['mata_pelajaran'] . " | WaliKelas: " . $g['kelas_wali'] . " | SekolahID: " . $g['sekolah_id'] . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
