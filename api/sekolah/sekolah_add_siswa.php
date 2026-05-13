<?php
include_once __DIR__ . '/../shared/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

$sekolah_id = !empty($data->sekolah_id) ? $data->sekolah_id : '';
$nis = !empty($data->nis) ? trim($data->nis) : '';
$nama = !empty($data->nama) ? trim($data->nama) : '';
$email = !empty($data->email) ? trim($data->email) : '';
$kelas = !empty($data->kelas) ? trim($data->kelas) : '';
$password = !empty($data->password) ? $data->password : 'siswa123';

if (!$sekolah_id || !$nis || !$nama || !$kelas) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Data tidak lengkap (NIS, Nama, dan Kelas wajib diis)"]);
    exit();
}

try {
    // 1. Cek apakah NIS sudah terdaftar di sekolah ini
    $stmtCheck = $db->prepare("SELECT id FROM siswa WHERE sekolah_id = ? AND nis = ?");
    $stmtCheck->execute([$sekolah_id, $nis]);
    if ($stmtCheck->rowCount() > 0) {
        echo json_encode(["status" => "error", "message" => "Siswa dengan NIS $nis sudah terdaftar"]);
        exit();
    }

    $db->beginTransaction();

    // 2. Buat ID unik untuk user
    $user_id = bin2hex(random_bytes(16));
    
    // 3. Simpan Akun User
    $password_hash = password_hash($password, PASSWORD_BCRYPT);
    $final_email = !empty($email) ? $email : ($nis . "@mbg.lavira.com");
    
    $stmtUser = $db->prepare("INSERT INTO users (id, nama, username, email, password_hash, role, sekolah_id, is_active) 
                              VALUES (:id, :nama, :username, :email, :password, 'siswa', :sekolah_id, 1)");
    $stmtUser->execute([
        ':id' => $user_id,
        ':nama' => $nama,
        ':username' => $nis,
        ':email' => $final_email,
        ':password' => $password_hash,
        ':sekolah_id' => $sekolah_id
    ]);

    // 4. Cari Wali Kelas jika ada
    $stmtWali = $db->prepare("SELECT id FROM guru WHERE sekolah_id = ? AND kelas_wali = ? LIMIT 1");
    $stmtWali->execute([$sekolah_id, $kelas]);
    $wali = $stmtWali->fetch();
    $guru_id = $wali ? $wali['id'] : null;

    // 5. Simpan Data Siswa
    $qr_token = $sekolah_id . "_" . $nis;
    $siswa_id = bin2hex(random_bytes(16));
    $stmtSiswa = $db->prepare("INSERT INTO siswa (id, user_id, sekolah_id, guru_id, nis, nama, kelas, qr_code_token) 
                               VALUES (:id, :user_id, :sekolah_id, :guru_id, :nis, :nama, :kelas, :qr_code)");
    $stmtSiswa->execute([
        ':id' => $siswa_id,
        ':user_id' => $user_id,
        ':sekolah_id' => $sekolah_id,
        ':guru_id' => $guru_id,
        ':nis' => $nis,
        ':nama' => $nama,
        ':kelas' => $kelas,
        ':qr_code' => $qr_token
    ]);

    // 5. Update jumlah siswa di tabel sekolah agar dashboard sinkron
    $stmtUpdate = $db->prepare("UPDATE sekolah SET jumlah_siswa = (SELECT COUNT(*) FROM siswa WHERE sekolah_id = :sid) WHERE id = :sid2");
    $stmtUpdate->execute([':sid' => $sekolah_id, ':sid2' => $sekolah_id]);

    $db->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Siswa $nama berhasil ditambahkan. Email login: $final_email",
        "data" => [
            "siswa_id" => $siswa_id,
            "user_id" => $user_id,
            "username" => $nis,
            "password_default" => $password
        ]
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
