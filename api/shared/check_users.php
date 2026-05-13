<?php
include_once __DIR__ . '/config.php';
header("Content-Type: text/plain");

try {
    $stmt = $db->query("SELECT id, nama, username, email, role, password_hash FROM users LIMIT 10");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($users)) {
        echo "TIdak ada user di database.\n";
    } else {
        echo "Daftar User (Maks 10):\n";
        foreach ($users as $u) {
            $h = $u['password_hash'];
            $is_hashed = (strpos($h, '$2y$') === 0) ? "YES (BCRYPT)" : "NO (PLAIN TEXT?)";
            echo "ID: {$u['id']} | User: {$u['username']} | Role: {$u['role']} | Hashed: $is_hashed\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
