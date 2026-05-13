<?php
include_once __DIR__ . '/../shared/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

$sekolah_id = !empty($data->sekolah_id) ? $data->sekolah_id : '';
$nip = !empty($data->nip) ? trim($data->nip) : '';
$nama = !empty($data->nama) ? trim($data->nama) : '';
$email = !empty($data->email) ? trim($data->email) : '';
$mata_pelajaran = !empty($data->mata_pelajaran) ? trim($data->mata_pelajaran) : '-';
$kelas_wali = !empty($data->kelas_wali) ? trim($data->kelas_wali) : null;
$password = !empty($data->password) ? $data->password : 'guru123';

if (!$sekolah_id || !$nip || !$nama) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Data tidak lengkap (NIP dan Nama wajib diisi)"]);
    exit();
}

try {
    // 1. Cek apakah NIP sudah terdaftar
    $stmtCheck = $db->prepare("SELECT id FROM guru WHERE nip = ?");
    $stmtCheck->execute([$nip]);
    if ($stmtCheck->rowCount() > 0) {
        echo json_encode(["status" => "error", "message" => "Guru dengan NIP $nip sudah terdaftar"]);
        exit();
    }

    $db->beginTransaction();

    // 2. Buat ID unik untuk user
    $user_id = bin2hex(random_bytes(16));
    
    // 3. Simpan Akun User
    $password_hash = password_hash($password, PASSWORD_BCRYPT);
    $final_email = !empty($email) ? $email : ($nip . "@guru.lavira.com");
    
    $stmtUser = $db->prepare("INSERT INTO users (id, nama, username, email, password_hash, role, sekolah_id, is_active) 
                              VALUES (:id, :nama, :username, :email, :password, 'guru', :sekolah_id, 1)");
    $stmtUser->execute([
        ':id' => $user_id,
        ':nama' => $nama,
        ':username' => $nip,
        ':email' => $final_email,
        ':password' => $password_hash,
        ':sekolah_id' => $sekolah_id
    ]);

    // 4. Simpan Data Guru
    $guru_id = bin2hex(random_bytes(16));
    $stmtGuru = $db->prepare("INSERT INTO guru (id, user_id, sekolah_id, nip, nama, mata_pelajaran, kelas_wali) 
                               VALUES (:id, :user_id, :sekolah_id, :nip, :nama, :mapel, :kelas_wali)");
    $stmtGuru->execute([
        ':id' => $guru_id,
        ':user_id' => $user_id,
        ':sekolah_id' => $sekolah_id,
        ':nip' => $nip,
        ':nama' => $nama,
        ':mapel' => $mata_pelajaran,
        ':kelas_wali' => $kelas_wali
    ]);

    // 5. Link Guru ke Siswa di Kelas tersebut (Wali Kelas)
    if (!empty($kelas_wali)) {
        $stmtUpdateSiswa = $db->prepare("UPDATE siswa SET guru_id = ? WHERE sekolah_id = ? AND kelas = ?");
        $stmtUpdateSiswa->execute([$guru_id, $sekolah_id, $kelas_wali]);
    }

    $db->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Guru $nama berhasil ditambahkan. Email login: $final_email",
        "data" => [
            "guru_id" => $guru_id,
            "user_id" => $user_id,
            "username" => $nip,
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
