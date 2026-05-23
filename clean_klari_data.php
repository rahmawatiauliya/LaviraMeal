<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");

// ID SMAN 1 Klari yang ditemukan sebelumnya
$sekolah_id = 'eff84c6b-c3d7-4811-baf8-c10a2af232e7';

echo "Cleaning data for SMAN 1 Klari (ID: $sekolah_id)...\n\n";

try {
    $db->beginTransaction();

    // 1. Ambil User ID admin sekolah tersebut
    $stmt = $db->prepare("SELECT user_id FROM sekolah WHERE id = ?");
    $stmt->execute([$sekolah_id]);
    $user_id = $stmt->fetchColumn();

    // 2. Hapus Siswa (beserta akun user mereka jika ada)
    echo "Deleting students...\n";
    // Cari user_id para siswa
    $stmt_siswa_users = $db->prepare("SELECT user_id FROM siswa WHERE sekolah_id = ?");
    $stmt_siswa_users->execute([$sekolah_id]);
    $siswa_user_ids = $stmt_siswa_users->fetchAll(PDO::FETCH_COLUMN);
    
    if (!empty($siswa_user_ids)) {
        $placeholders = implode(',', array_fill(0, count($siswa_user_ids), '?'));
        $db->prepare("DELETE FROM users WHERE id IN ($placeholders)")->execute($siswa_user_ids);
        echo count($siswa_user_ids) . " student user accounts deleted.\n";
    }
    
    // Hapus sisa data di tabel siswa
    $db->prepare("DELETE FROM siswa WHERE sekolah_id = ?")->execute([$sekolah_id]);

    // 3. Hapus Kantin
    echo "Deleting kantin...\n";
    $db->prepare("DELETE FROM kantin WHERE sekolah_id = ?")->execute([$sekolah_id]);

    // 4. Hapus Guru
    echo "Deleting gurus...\n";
    $db->prepare("DELETE FROM guru WHERE sekolah_id = ?")->execute([$sekolah_id]);

    // 5. Hapus Sekolah (ini juga akan menghapus user admin sekolah karena ON DELETE CASCADE di tabel sekolah -> users)
    // Tunggu, di database.sql: sekolah_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    // Berarti kalau User dihapus, Sekolah terhapus.
    if ($user_id) {
        echo "Deleting school admin user ($user_id)...\n";
        $db->prepare("DELETE FROM users WHERE id = ?")->execute([$user_id]);
        echo "School and Admin User deleted.\n";
    } else {
        echo "Deleting school record directly...\n";
        $db->prepare("DELETE FROM sekolah WHERE id = ?")->execute([$sekolah_id]);
    }

    $db->commit();
    echo "\nClean up successful! SMAN 1 Klari and all related data have been removed.";

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    echo "Error: " . $e->getMessage();
}
?>
