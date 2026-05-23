<?php
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__ . '/../shared/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

$sekolah_id = isset($_REQUEST['sekolah_id']) ? $_REQUEST['sekolah_id'] : null;

if (!$sekolah_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Sekolah ID tidak ditemukan"]);
    exit();
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "File tidak valid"]);
    exit();
}

$fileTmpPath = $_FILES['file']['tmp_name'];

try {
    $file = fopen($fileTmpPath, 'r');
    
    // Detect delimiter
    $firstLine = fgets($file);
    $delimiter = (strpos($firstLine, ';') !== false) ? ';' : ',';
    rewind($file);

    // Skip header
    fgetcsv($file, 1000, $delimiter);

    $successCount = 0;
    $duplicateCount = 0;
    $errorCount = 0;

    $password_default = password_hash("guru123", PASSWORD_BCRYPT);

    while (($row = fgetcsv($file, 1000, $delimiter)) !== FALSE) {
        if (count($row) < 2 || empty(trim($row[0]))) continue;

        $nip = trim($row[0]);
        $nama = trim($row[1]);
        $email = isset($row[2]) ? trim($row[2]) : ($nip . "@guru.lavira.com");
        $mapel = isset($row[3]) ? trim($row[3]) : '-';
        $kelas_wali = isset($row[4]) ? trim($row[4]) : null;

        // Check duplicate
        $check = $db->prepare("SELECT id FROM users WHERE username = ?");
        $check->execute([$nip]);
        if ($check->rowCount() > 0) {
            $duplicateCount++;
            continue;
        }

        try {
            $db->beginTransaction();

            $user_id = bin2hex(random_bytes(16));
            
            // Insert User
            $stmtUser = $db->prepare("INSERT INTO users (id, nama, username, email, password_hash, role, sekolah_id, is_active) 
                                      VALUES (:id, :nama, :username, :email, :password, 'guru', :sekolah_id, 1)");
            $stmtUser->execute([
                ':id' => $user_id,
                ':nama' => $nama,
                ':username' => $nip,
                ':email' => $email,
                ':password' => $password_default,
                ':sekolah_id' => $sekolah_id
            ]);

            // Insert Guru
            $guru_id = bin2hex(random_bytes(16));
            $stmtGuru = $db->prepare("INSERT INTO guru (id, user_id, sekolah_id, nip, nama, mata_pelajaran, kelas_wali) 
                                       VALUES (:id, :user_id, :sekolah_id, :nip, :nama, :mapel, :kelas_wali)");
            $stmtGuru->execute([
                ':id' => $guru_id,
                ':user_id' => $user_id,
                ':sekolah_id' => $sekolah_id,
                ':nip' => $nip,
                ':nama' => $nama,
                ':mapel' => $mapel,
                ':kelas_wali' => $kelas_wali
            ]);

            $db->commit();
            $successCount++;
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            $errorCount++;
        }
    }

    fclose($file);

    echo json_encode([
        "status" => "success",
        "message" => "Berhasil mengimport $successCount guru baru.",
        "data" => ["success" => $successCount, "duplicate" => $duplicateCount, "error" => $errorCount]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
