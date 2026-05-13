<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "Checking Database Connection...\n";
try {
    require_once 'config.php';
    echo "Include Success.\n";
    
    if (isset($db)) {
        echo "Database Object: SUCCESS\n";
        $stmt = $db->query("SELECT 'OK' as status");
        $res = $stmt->fetch();
        echo "Database Query: " . $res['status'] . "\n";
    } else {
        echo "Database Object: FAILED (Variable not set)\n";
    }
} catch (Exception $e) {
    echo "Connection Error: " . $e->getMessage() . "\n";
}
