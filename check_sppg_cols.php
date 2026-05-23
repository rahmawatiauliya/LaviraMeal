<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");

try {
    $stmt = $db->query("DESCRIBE sppg");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo $row['Field'] . " (" . $row['Type'] . ")\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
