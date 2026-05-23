<?php
// Mock data
$_SERVER['REQUEST_METHOD'] = 'POST';
$mock_input = json_encode([
    'nama' => 'Test SPPG',
    'nik' => '1234567890123456',
    'hp' => '0812345678',
    'email' => 'test' . uniqid() . '@test.com',
    'password' => 'password123',
    'wilayah' => 'Karawang Barat',
    'username' => 'testuser' . uniqid()
]);

// Override php://input
function file_get_contents_mock($path) {
    global $mock_input;
    if ($path === 'php://input') return $mock_input;
    return file_get_contents($path);
}

// We can't easily override file_get_contents.
// Let's just create a script that calls the logic.

include_once __DIR__ . '/api/shared/config.php';

$data = json_decode($mock_input);

$nama = $data->nama;
$nik = $data->nik;
$hp = $data->hp;
$email = $data->email;
$pass = $data->password;
$wilayah = $data->wilayah;
$username_req = $data->username;
$role = 'sppg';

try {
    $db->beginTransaction();
    $user_id = 'USR-' . strtoupper(substr(md5(uniqid(rand(), true)), 0, 8));
    $sppg_id = 'SPPG-' . strtoupper(substr(md5(uniqid(rand(), true)), 0, 8));
    $password_hash = password_hash($pass, PASSWORD_BCRYPT);
    $username = $username_req;

    $query = "INSERT INTO users (id, nama, username, email, password_hash, role, sppg_id, is_active) 
              VALUES (:id, :nama, :username, :email, :password_hash, :role, NULL, 1)";
    $stmt = $db->prepare($query);
    $stmt->execute([':id' => $user_id, ':nama' => $nama, ':username' => $username, ':email' => $email, ':password_hash' => $password_hash, ':role' => $role]);

    $sqlSppg = "INSERT INTO sppg (id, user_id, nik, nama_lembaga, wilayah, kode_sppg, no_telp, email_lembaga, alamat) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmtSppg = $db->prepare($sqlSppg);
    $stmtSppg->execute([$sppg_id, $user_id, $nik, $nama, $wilayah, 'SPPG-' . strtoupper(substr(uniqid(), -5)), $hp, $email, '-']);

    $stmtUpdate = $db->prepare("UPDATE users SET sppg_id = :sppg_id WHERE id = :user_id");
    $stmtUpdate->execute([':sppg_id' => $sppg_id, ':user_id' => $user_id]);

    $db->commit();
    echo "SUCCESS\n";
} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
