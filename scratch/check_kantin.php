<?php
include_once __DIR__ . '/../api/shared/config.php';
header("Content-Type: text/plain");

function describeTable($db, $table) {
    echo "--- $table ---\n";
    try {
        $stmt = $db->query("DESCRIBE `$table`");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo $row['Field'] . " (" . $row['Type'] . ")\n";
        }
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
    echo "\n";
}

describeTable($db, 'kantin');
?>
