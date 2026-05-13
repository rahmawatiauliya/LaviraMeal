<?php
include_once 'api/shared/config.php';
header("Content-Type: text/plain");

echo "Testing DB Connection...\n";
if (isset($db)) {
    echo "Connection OK\n\n";
} else {
    echo "Connection FAILED\n";
    exit;
}

$query = "SELECT u.id, u.nama, u.username, u.email, u.password_hash, u.role, u.is_active,
                 u.sekolah_id, 
                 COALESCE(u.sppg_id, sp.id) AS sppg_id,
                 s.nama_sekolah, 
                 sp.nama_lembaga,
                 ss.nis,
                 ss.kelas,
                 g.id AS guru_id,
                 g.kelas_wali
          FROM users u 
          LEFT JOIN sekolah s ON u.sekolah_id = s.id 
          LEFT JOIN sppg sp ON u.sppg_id = sp.id OR sp.user_id = u.id
          LEFT JOIN siswa ss ON u.id = ss.user_id 
          LEFT JOIN guru g ON u.id = g.user_id
          LIMIT 1";

echo "Executing Query:\n$query\n\n";

try {
    $stmt = $db->query($query);
    $res = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Query Result: " . ($res ? "Data Found" : "No Data") . "\n";
    if ($res) {
        print_r($res);
    }
} catch (PDOException $e) {
    echo "QUERY ERROR: " . $e->getMessage() . "\n";
}
?>
