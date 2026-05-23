<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");

try {
    $stmt = $db->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        echo $row[0] . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
