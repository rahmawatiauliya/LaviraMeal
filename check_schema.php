<?php
include_once 'api/shared/config.php';
header("Content-Type: text/plain");

echo "DATABASE SCHEMA CHECKER\n";
echo "=======================\n";

$tables_to_check = ['users', 'sekolah', 'sppg', 'siswa', 'guru'];
$required_columns = [
    'users' => ['id', 'nama', 'username', 'email', 'password_hash', 'role', 'sekolah_id', 'sppg_id', 'is_active', 'last_login'],
    'sekolah' => ['id', 'nama_sekolah'],
    'sppg' => ['id', 'nama_lembaga', 'user_id'],
    'siswa' => ['id', 'user_id', 'nis', 'kelas'],
    'guru' => ['id', 'user_id', 'kelas_wali']
];

try {
    foreach ($tables_to_check as $table) {
        echo "Checking table '$table'...";
        $stmt = $db->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo " OK\n";
            $columns = $db->query("DESCRIBE $table")->fetchAll(PDO::FETCH_COLUMN);
            foreach ($required_columns[$table] as $col) {
                echo "  - Column '$col': " . (in_array($col, $columns) ? "OK" : "MISSING") . "\n";
            }
        } else {
            echo " MISSING\n";
        }
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
