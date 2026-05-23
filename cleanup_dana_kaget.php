<?php
include_once __DIR__ . '/api/shared/config.php';

try {
    $db->exec("DROP TABLE IF EXISTS dana_kaget");
    echo "Table 'dana_kaget' dropped successfully.\n";
} catch (PDOException $e) {
    echo "Error dropping table: " . $e->getMessage() . "\n";
}

// Also cleanup activity logs related to these features if desired, but dropping table is the main request.
echo "Cleanup complete.";
?>
