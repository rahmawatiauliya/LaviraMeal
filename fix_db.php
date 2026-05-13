<?php
include_once __DIR__ . '/api/shared/config.php';

echo "Memulai perbaikan database...\n";

function addColumn($db, $table, $column, $type) {
    try {
        $db->query("SELECT $column FROM $table LIMIT 1");
        echo "Kolom $column di tabel $table sudah ada.\n";
    } catch (Exception $e) {
        try {
            $db->exec("ALTER TABLE $table ADD $column $type");
            echo "Berhasil menambahkan kolom $column ke tabel $table.\n";
        } catch (Exception $e2) {
            echo "Gagal menambahkan kolom $column ke tabel $table: " . $e2->getMessage() . "\n";
        }
    }
}

// 1. Perbaikan Tabel users
echo "\nMengecek tabel users...\n";
addColumn($db, 'users', 'username', 'VARCHAR(100)');
addColumn($db, 'users', 'role', "ENUM('admin', 'sppg', 'sekolah', 'guru', 'kantin', 'siswa')");
addColumn($db, 'users', 'is_active', 'TINYINT(1) DEFAULT 1');
addColumn($db, 'users', 'sppg_id', 'CHAR(36)');
addColumn($db, 'users', 'sekolah_id', 'CHAR(36)');
addColumn($db, 'users', 'last_login', 'DATETIME');

// 2. Perbaikan Tabel sppg
echo "\nMengecek tabel sppg...\n";
$db->exec("CREATE TABLE IF NOT EXISTS sppg (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36),
    nama_lembaga VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");
addColumn($db, 'sppg', 'nik', 'VARCHAR(20)');
addColumn($db, 'sppg', 'wilayah', 'VARCHAR(100)');
addColumn($db, 'sppg', 'kode_sppg', 'VARCHAR(50)');
addColumn($db, 'sppg', 'no_telp', 'VARCHAR(20)');
addColumn($db, 'sppg', 'email_lembaga', 'VARCHAR(100)');
addColumn($db, 'sppg', 'alamat', 'TEXT');

// 3. Perbaikan Tabel guru
echo "\nMengecek tabel guru...\n";
$db->exec("CREATE TABLE IF NOT EXISTS guru (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");
addColumn($db, 'guru', 'nip', 'VARCHAR(50)');
addColumn($db, 'guru', 'no_hp', 'VARCHAR(20)');
addColumn($db, 'guru', 'sekolah_id', 'CHAR(36)');
addColumn($db, 'guru', 'kode_undangan', 'VARCHAR(50)');
addColumn($db, 'guru', 'mata_pelajaran', 'VARCHAR(100)');
addColumn($db, 'guru', 'kelas_diampu', 'VARCHAR(50)');
addColumn($db, 'guru', 'status_verifikasi', "ENUM('pending', 'approved', 'rejected') DEFAULT 'approved'");

// 4. Perbaikan Tabel sekolah (Jika ada)
echo "\nMengecek tabel sekolah...\n";
$db->exec("CREATE TABLE IF NOT EXISTS sekolah (
    id CHAR(36) PRIMARY KEY,
    npsn VARCHAR(20),
    nama VARCHAR(100),
    wilayah VARCHAR(100),
    alamat TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");
addColumn($db, 'sekolah', 'kode_undangan', 'VARCHAR(50)');
addColumn($db, 'sekolah', 'saldo', 'DECIMAL(15,2) DEFAULT 0');

echo "\nPerbaikan database selesai.\n";
?>
