<?php
include_once __DIR__ . '/api/shared/config.php';
header("Content-Type: text/plain");
try {
    echo "--- All Notifications in Database ---\n";
    $stmt = $db->query("SELECT id, role, title, message, created_at FROM notifications ORDER BY created_at DESC");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
