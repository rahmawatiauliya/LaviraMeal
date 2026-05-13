<?php
include_once __DIR__ . '/../shared/config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}
file_put_contents('debug_import.log', "POST Data: " . print_r($_POST, true) . "\n", FILE_APPEND);
file_put_contents('debug_import.log', "FILES Data: " . print_r($_FILES, true) . "\n", FILE_APPEND);

// Ambil sekolah_id dari form-data atau URL (Dukungan kedua metode agar lebih aman)
$sekolah_id = isset($_REQUEST['sekolah_id']) ? $_REQUEST['sekolah_id'] : null;

if (!$sekolah_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Sekolah ID tidak ditemukan", "debug_post" => $_POST, "debug_get" => $_GET]);
    exit();
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "File tidak valid atau tidak diunggah"]);
    exit();
}

$fileTmpPath = $_FILES['file']['tmp_name'];
$fileName = $_FILES['file']['name'];
$fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

// Log untuk debug
file_put_contents('debug_import.log', "Starting import for $fileName at " . date('Y-m-d H:i:s') . "\n", FILE_APPEND);

if ($fileExtension !== 'csv' && $fileExtension !== 'txt') {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Mohon gunakan file CSV (.csv)"]);
    exit();
}

try {
    // Membaca file dan memastikan encodingnya UTF-8
    $content = file_get_contents($fileTmpPath);
    $encoding = mb_detect_encoding($content, ['UTF-8', 'ISO-8859-1', 'WINDOWS-1252']);
    if ($encoding !== 'UTF-8') {
        $content = mb_convert_encoding($content, 'UTF-8', $encoding);
    }
    
    // Tulis ulang ke temp file dalam UTF-8
    $newTmp = tempnam(sys_get_temp_dir(), 'csv');
    file_put_contents($newTmp, $content);

    $file = fopen($newTmp, 'r');
    
    // Detect delimiter (komma atau titik koma)
    $firstLine = fgets($file);
    file_put_contents('debug_import.log', "First line: $firstLine\n", FILE_APPEND);
    
    $delimiter = (strpos($firstLine, ';') !== false) ? ';' : ',';
    rewind($file);

    // Skip header
    fgetcsv($file, 1000, $delimiter);

    $successCount = 0;
    $errorCount = 0;
    $duplicateCount = 0;

    $stmt = $db->prepare("INSERT INTO siswa (id, user_id, sekolah_id, nis, nama, kelas, jenis_kelamin, tanggal_lahir, nama_wali, no_telp_wali, qr_code_token, aktif) 
                          VALUES (UUID(), :user_id, :sekolah_id, :nis, :nama, :kelas, :jenis_kelamin, :tanggal_lahir, :nama_wali, :no_telp_wali, :qr_code, 0)");

    // Siapkan proses insert akun otomatis
    $password_default = password_hash("siswa123", PASSWORD_BCRYPT);
    $stmtUser = $db->prepare("INSERT INTO users (id, nama, username, email, password_hash, role, sekolah_id, is_active) 
                              VALUES (:id, :nama, :username, :email, :password, 'siswa', :sekolah_id, 0)");

    while (($row = fgetcsv($file, 1000, $delimiter)) !== FALSE) {
        if (count($row) < 3 || empty(trim($row[0]))) {
            file_put_contents('debug_import.log', "Skipping row: " . implode('|', $row) . "\n", FILE_APPEND);
            continue; 
        }

        $nis = trim($row[0]);
        $nama = trim($row[1]);
        $kelas = trim($row[2]);
        $jk = isset($row[3]) ? trim($row[3]) : null;
        $tgl_lahir = (isset($row[4]) && !empty($row[4])) ? trim($row[4]) : null;
        $wali = isset($row[5]) ? trim($row[5]) : null;
        $telp_wali = isset($row[6]) ? trim($row[6]) : null;
        $qr_token = $sekolah_id . "_" . $nis; // Generate simple unique token

        // Check duplicate Siswa
        $stmtCheck = $db->prepare("SELECT id FROM siswa WHERE sekolah_id = ? AND nis = ?");
        $stmtCheck->execute([$sekolah_id, $nis]);
        if ($stmtCheck->rowCount() > 0) {
            $duplicateCount++;
            file_put_contents('debug_import.log', "Duplicate: $nis\n", FILE_APPEND);
            continue;
        }

        try {
            $user_uuid = null;
            // 1. Cek dulu apakah username (NIS) ini sudah ada di tabel users
            $stmtCheckUser = $db->prepare("SELECT id FROM users WHERE username = ?");
            $stmtCheckUser->execute([$nis]);
            if ($stmtCheckUser->rowCount() === 0) {
                // Buat Akun Baru
                $user_uuid = bin2hex(random_bytes(16)); // Or use UUID() in SQL, but we need it for the next query
                $email_placeholder = $nis . "@mbg.lavira.com";
                $stmtUser->execute([
                    ':id' => $user_uuid,
                    ':nama' => $nama,
                    ':username' => $nis,
                    ':email' => $email_placeholder,
                    ':password' => $password_default,
                    ':sekolah_id' => $sekolah_id
                ]);
            } else {
                $user_uuid = $stmtCheckUser->fetch(PDO::FETCH_ASSOC)['id'];
            }

            // 2. Simpan Data Siswa (Sertakan user_id)
            $stmt->execute([
                ':sekolah_id' => $sekolah_id,
                ':user_id' => $user_uuid,
                ':nis' => $nis,
                ':nama' => $nama,
                ':kelas' => $kelas,
                ':jenis_kelamin' => $jk,
                ':tanggal_lahir' => $tgl_lahir,
                ':nama_wali' => $wali,
                ':no_telp_wali' => $telp_wali,
                ':qr_code' => $qr_token
            ]);

            $successCount++;
        } catch (Exception $e) {
            $errorCount++;
            file_put_contents('debug_import.log', "SQL Error for $nis: " . $e->getMessage() . "\n", FILE_APPEND);
        }
    }
    
    fclose($file);

    // Update jumlah_siswa di tabel sekolah agar dashboard sinkron
    if ($successCount > 0) {
        $stmtUpdate = $db->prepare("UPDATE sekolah SET jumlah_siswa = (SELECT COUNT(*) FROM siswa WHERE sekolah_id = :sid) WHERE id = :sid2");
        $stmtUpdate->execute([':sid' => $sekolah_id, ':sid2' => $sekolah_id]);
    }

    echo json_encode([
        "status" => "success",
        "message" => "Import selesai dengan $successCount data berhasil, $duplicateCount duplikat, dan $errorCount error.",
        "data" => [
            "success" => $successCount,
            "duplicate" => $duplicateCount,
            "error" => $errorCount
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
