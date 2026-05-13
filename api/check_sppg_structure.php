<?php
include_once __DIR__ . '/shared/config.php';
try {
    $stmt = $db->query("DESCRIBE sppg");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($columns, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo $e->getMessage();
}
?>
