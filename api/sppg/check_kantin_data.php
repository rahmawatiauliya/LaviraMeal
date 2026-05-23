<?php
include_once __DIR__ . '/../shared/config.php';
header('Content-Type: text/plain');

try {
    // 1. Ambil deskripsi tabel kantin
    $stmt = $db->query("SHOW CREATE TABLE `kantin`");
    $row = $stmt->fetch(PDO::FETCH_NUM);
    echo "=== SCHEMA KANTIN ===\n" . $row[1] . "\n\n";

    // 2. Ambil semua kantin beserta data sekolah terkait
    $stmt = $db->query("
        SELECT k.id, k.user_id, k.nama_kantin, k.sekolah_id, k.npsn_sekolah, k.pemilik, k.is_aktif, k.status_sekolah, k.status_sppg,
               s.nama_sekolah, s.npsn
        FROM kantin k
        LEFT JOIN sekolah s ON k.sekolah_id = s.id
    ");
    $kantins = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "=== DATA KANTIN DI DATABASE ===\n";
    print_r($kantins);

    // 3. Ambil semua user kantin
    $stmt = $db->query("SELECT id, nama, username, email, role, is_active FROM users WHERE role = 'kantin'");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "=== DATA USERS KANTIN ===\n";
    print_r($users);

} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>

