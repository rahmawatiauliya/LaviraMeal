<?php
include_once __DIR__ . '/config.php';
header("Content-Type: text/plain");

echo "Checking and fixing 'kantin' table schema...\n";

try {
    // Ambil kolom yang sudah ada
    $columns = $db->query("DESCRIBE kantin")->fetchAll(PDO::FETCH_COLUMN);
    
    $queries = [
        'foto_kantin' => "ALTER TABLE kantin ADD COLUMN foto_kantin VARCHAR(255) DEFAULT NULL AFTER nama_kantin",
        'foto_menu' => "ALTER TABLE kantin ADD COLUMN foto_menu VARCHAR(255) DEFAULT NULL AFTER foto_kantin",
        'npsn_sekolah' => "ALTER TABLE kantin ADD COLUMN npsn_sekolah VARCHAR(20) DEFAULT NULL AFTER foto_menu",
        'is_verified_sppg' => "ALTER TABLE kantin ADD COLUMN is_verified_sppg TINYINT DEFAULT 0 AFTER npsn_sekolah",
        'is_verified_sekolah' => "ALTER TABLE kantin ADD COLUMN is_verified_sekolah TINYINT DEFAULT 0 AFTER is_verified_sppg"
    ];

    foreach ($queries as $col => $sql) {
        if (!in_array($col, $columns)) {
            echo "Adding column '$col'...\n";
            $db->exec($sql);
        } else {
            echo "Column '$col' already exists.\n";
        }
    }

    echo "\nDatabase schema fixed successfully! You can try registering again.";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
