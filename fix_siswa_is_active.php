<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");

try {
    // Check if 'aktif' exists
    $stmt = $db->query("SHOW COLUMNS FROM siswa LIKE 'aktif'");
    if ($stmt->rowCount() > 0) {
        $db->exec("ALTER TABLE siswa CHANGE aktif is_active TINYINT(1) NOT NULL DEFAULT 0");
        echo "Renamed 'aktif' to 'is_active' in 'siswa' table.\n";
    } else {
        echo "'aktif' column not found.\n";
    }
    
    // Also ensure other columns are correct
    $db->exec("ALTER TABLE siswa MODIFY COLUMN nis VARCHAR(50) NOT NULL");
    $db->exec("ALTER TABLE siswa MODIFY COLUMN nama VARCHAR(200) NOT NULL");
    
    echo "Success!";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
