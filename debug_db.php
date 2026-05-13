<?php
include_once __DIR__ . '/api/shared/config.php';
$tables = ['users', 'guru', 'sppg', 'sekolah'];
foreach($tables as $t) {
    try {
        $stmt = $db->query("DESCRIBE $t");
        echo "\nTable: $t\n";
        print_r($stmt->fetchAll());
    } catch(Exception $e) {
        echo "\nTable $t not found or error: " . $e->getMessage() . "\n";
    }
}
?>
