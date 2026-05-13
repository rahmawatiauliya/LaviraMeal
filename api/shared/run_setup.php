<?php
include_once __DIR__ . '/../shared/config.php';

$sql = file_get_contents(__DIR__ . '/database.sql');

try {
    $db->exec($sql);
    echo "Database setup successful.\n";
} catch (PDOException $e) {
    echo "Database setup failed: " . $e->getMessage() . "\n";
}
?>
