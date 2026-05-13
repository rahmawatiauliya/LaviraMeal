<?php
include_once __DIR__ . '/config.php';
header("Content-Type: text/plain");

echo "Checking and fixing database for GURU role...\n";

try {
    // 1. Check if guru table exists
    $tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('guru', $tables)) {
        echo "Creating 'guru' table...\n";
        $db->exec("CREATE TABLE `guru` (
          `id` char(36) NOT NULL,
          `user_id` char(36) NOT NULL,
          `sekolah_id` char(36) NOT NULL,
          `nip` varchar(30) DEFAULT NULL,
          `nama` varchar(150) NOT NULL,
          `mata_pelajaran` varchar(100) DEFAULT NULL,
          `kelas_wali` varchar(20) DEFAULT NULL,
          `no_telp` varchar(20) DEFAULT NULL,
          `is_aktif` tinyint(1) NOT NULL DEFAULT 1,
          `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
          `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (`id`),
          UNIQUE KEY `user_id` (`user_id`),
          UNIQUE KEY `nip` (`nip`),
          KEY `sekolah_id` (`sekolah_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;");
    } else {
        echo "'guru' table already exists.\n";
    }

    // 2. Check users table columns
    $columns = $db->query("DESCRIBE users")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('sekolah_id', $columns)) {
        echo "Adding 'sekolah_id' to 'users'...\n";
        $db->exec("ALTER TABLE users ADD COLUMN sekolah_id char(36) DEFAULT NULL AFTER role");
    }
    if (!in_array('sppg_id', $columns)) {
        echo "Adding 'sppg_id' to 'users'...\n";
        $db->exec("ALTER TABLE users ADD COLUMN sppg_id char(36) DEFAULT NULL AFTER sekolah_id");
    }

    // 3. Check if any user with role 'guru' exists but doesn't have a record in 'guru' table
    $stmt = $db->query("SELECT id, nama, sekolah_id FROM users WHERE role = 'guru'");
    $gurus = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($gurus as $g) {
        $stmtCheck = $db->prepare("SELECT id FROM guru WHERE user_id = ?");
        $stmtCheck->execute([$g['id']]);
        if (!$stmtCheck->fetch()) {
            echo "Creating guru record for user: {$g['nama']}...\n";
            $guru_id = bin2hex(random_bytes(16));
            $stmtInsert = $db->prepare("INSERT INTO guru (id, user_id, sekolah_id, nama) VALUES (?, ?, ?, ?)");
            $stmtInsert->execute([$guru_id, $g['id'], $g['sekolah_id'], $g['nama']]);
        }
    }

    echo "\nDatabase fix completed successfully.\n";
    echo "You should now be able to login as Guru.\n";

} catch (Exception $e) {
    echo "Error fixing database: " . $e->getMessage() . "\n";
}
?>
