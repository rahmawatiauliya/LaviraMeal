<?php
include_once __DIR__ . '/config.php';

try {
    $db->beginTransaction();

    // 1. Ambil siswa yang tidak punya user_id
    $stmt = $db->query("SELECT s.id, s.nis, s.nama, s.sekolah_id FROM siswa s WHERE s.user_id IS NULL OR s.user_id = ''");
    $siswaList = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Ditemukan " . count($siswaList) . " siswa tanpa user_id.\n";

    $password_default = password_hash("siswa123", PASSWORD_BCRYPT);
    $linkedCount = 0;
    $createdCount = 0;

    foreach ($siswaList as $siswa) {
        $nis = $siswa['nis'];
        $nama = $siswa['nama'];
        $sekolah_id = $siswa['sekolah_id'];
        $siswa_uuid = $siswa['id'];

        // Cek apakah user dengan username (NIS) sudah ada
        $stmtCheck = $db->prepare("SELECT id FROM users WHERE username = ?");
        $stmtCheck->execute([$nis]);
        $user = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // Link existing user
            $user_id = $user['id'];
            $stmtLink = $db->prepare("UPDATE siswa SET user_id = ? WHERE id = ?");
            $stmtLink->execute([$user_id, $siswa_uuid]);
            $linkedCount++;
        } else {
            // Create new user and link
            $user_id = bin2hex(random_bytes(16));
            $email = $nis . "@mbg.lavira.com";
            
            $stmtUser = $db->prepare("INSERT INTO users (id, nama, username, email, password_hash, role, sekolah_id, is_active) 
                                      VALUES (?, ?, ?, ?, ?, 'siswa', ?, 1)");
            $stmtUser->execute([$user_id, $nama, $nis, $email, $password_default, $sekolah_id]);

            $stmtLink = $db->prepare("UPDATE siswa SET user_id = ? WHERE id = ?");
            $stmtLink->execute([$user_id, $siswa_uuid]);
            $createdCount++;
        }
    }

    $db->commit();
    echo "Selesai: $linkedCount siswa dihubungkan ke akun yang ada, $createdCount akun baru dibuat.\n";

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    echo "Error: " . $e->getMessage() . "\n";
}
?>
