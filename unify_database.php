<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");

echo "UNIFY DATABASE SCHEMA\n";
echo "=====================\n";

function safeQuery($db, $sql) {
    try {
        $db->exec($sql);
        echo "SUCCESS: $sql\n";
    } catch (Exception $e) {
        echo "SKIP/ERROR: " . $e->getMessage() . "\n";
    }
}

// 1. Perbaikan Tabel users
echo "\nChecking table 'users'...\n";
safeQuery($db, "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER sppg_id");
safeQuery($db, "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL DEFAULT NULL AFTER is_active");
safeQuery($db, "ALTER TABLE users MODIFY COLUMN role ENUM('sppg','sekolah','kantin','guru','siswa') NOT NULL");

// 2. Perbaikan Tabel sekolah
echo "\nChecking table 'sekolah'...\n";
// Jika ada kolom 'nama', ubah jadi 'nama_sekolah'
try {
    $db->query("SELECT nama FROM sekolah LIMIT 1");
    safeQuery($db, "ALTER TABLE sekolah CHANGE COLUMN nama nama_sekolah VARCHAR(200)");
} catch (Exception $e) {}
safeQuery($db, "ALTER TABLE sekolah ADD COLUMN IF NOT EXISTS nama_sekolah VARCHAR(200) NOT NULL AFTER sppg_id");
safeQuery($db, "ALTER TABLE sekolah ADD COLUMN IF NOT EXISTS npsn VARCHAR(20) NOT NULL AFTER nama_sekolah");
safeQuery($db, "ALTER TABLE sekolah ADD COLUMN IF NOT EXISTS saldo DECIMAL(15,2) DEFAULT 0.00 AFTER updated_at");

// 3. Perbaikan Tabel sppg
echo "\nChecking table 'sppg'...\n";
safeQuery($db, "ALTER TABLE sppg ADD COLUMN IF NOT EXISTS nama_lembaga VARCHAR(200) NOT NULL AFTER user_id");
safeQuery($db, "ALTER TABLE sppg ADD COLUMN IF NOT EXISTS saldo DECIMAL(15,2) DEFAULT 75250000.00 AFTER updated_at");

// 4. Perbaikan Tabel guru
echo "\nChecking table 'guru'...\n";
// Jika ada kolom 'kelas_diampu', ubah jadi 'kelas_wali'
try {
    $db->query("SELECT kelas_diampu FROM guru LIMIT 1");
    safeQuery($db, "ALTER TABLE guru CHANGE COLUMN kelas_diampu kelas_wali VARCHAR(20)");
} catch (Exception $e) {}
safeQuery($db, "ALTER TABLE guru ADD COLUMN IF NOT EXISTS kelas_wali VARCHAR(20) DEFAULT NULL AFTER mata_pelajaran");
safeQuery($db, "ALTER TABLE guru ADD COLUMN IF NOT EXISTS is_aktif TINYINT(1) NOT NULL DEFAULT 1 AFTER no_telp");

// 5. Perbaikan Tabel siswa
echo "\nChecking table 'siswa'...\n";
safeQuery($db, "ALTER TABLE siswa ADD COLUMN IF NOT EXISTS nis VARCHAR(30) NOT NULL AFTER guru_id");
safeQuery($db, "ALTER TABLE siswa ADD COLUMN IF NOT EXISTS kelas VARCHAR(20) NOT NULL AFTER nama");

echo "\nDatabase unification completed.\n";
?>
