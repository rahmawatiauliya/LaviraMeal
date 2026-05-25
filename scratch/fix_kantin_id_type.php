<?php
include_once __DIR__ . '/../api/shared/config.php';
header("Content-Type: text/plain");

try {
    // 1. Alter transaksi_guru.kantin_id column from INT to VARCHAR(50)
    echo "Altering transaksi_guru.kantin_id to VARCHAR(50)...\n";
    $db->exec("ALTER TABLE transaksi_guru MODIFY COLUMN kantin_id VARCHAR(50) DEFAULT NULL");
    echo "Column type altered successfully!\n\n";

    // 2. Backfill existing transaksi_guru records that got clipped to '7'
    echo "Backfilling clipped kantin_id values...\n";
    $stmtUpdate = $db->prepare("UPDATE transaksi_guru SET kantin_id = '7ac82ed5-9564-491b-9cf5-640d72be7c0d' WHERE kantin_id = '7'");
    $stmtUpdate->execute();
    $rowsAffected = $stmtUpdate->rowCount();
    echo "Successfully updated $rowsAffected records!\n\n";

    // 3. Verify the changes
    echo "Verifying updated records in transaksi_guru:\n";
    $stmtSelect = $db->query("SELECT id, guru_id, kantin_id, message, created_at FROM transaksi_guru ORDER BY created_at DESC LIMIT 5");
    while ($row = $stmtSelect->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }

} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>
