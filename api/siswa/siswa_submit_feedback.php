<?php
header("Content-Type: application/json");
include_once __DIR__ . '/../shared/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    // Logging request payload for debugging
    $log_dir = __DIR__ . '/../../scratch';
    if (!file_exists($log_dir)) {
        mkdir($log_dir, 0777, true);
    }
    $log_data = "--- " . date('Y-m-d H:i:s') . " ---\n";
    $log_data .= "POST Params: " . print_r($_POST, true) . "\n";
    $log_data .= "FILES Params: " . print_r($_FILES, true) . "\n";
    $log_data .= "Headers: " . print_r(getallheaders(), true) . "\n\n";
    file_put_contents($log_dir . '/feedback_debug.log', $log_data, FILE_APPEND);

    $rating = isset($_POST['rating']) ? (int) $_POST['rating'] : 5;
    $review = isset($_POST['review']) ? $_POST['review'] : '';
    $kantin_id = isset($_POST['kantin_id']) ? $_POST['kantin_id'] : '';
    $siswa_id = isset($_POST['siswa_id']) ? $_POST['siswa_id'] : '';

    $transaksi_id = isset($_POST['transaksi_id']) ? $_POST['transaksi_id'] : null;

    if (empty($kantin_id)) {
        // Log bad request specifically
        file_put_contents($log_dir . '/feedback_debug.log', "ERROR: kantin_id is empty!\n\n", FILE_APPEND);
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID Kantin wajib diisi."]);
        exit;
    }

    try {
        // 1. Ambil sekolah_id dari kantin
        $stmtKantin = $db->prepare("SELECT sekolah_id FROM kantin WHERE id = ?");
        $stmtKantin->execute([$kantin_id]);
        $kantin = $stmtKantin->fetch(PDO::FETCH_ASSOC);

        if (!$kantin) {
            // Coba ambil dari users table (jika ID kantin adalah user_id)
            $stmtKUser = $db->prepare("SELECT sekolah_id FROM users WHERE id = ?");
            $stmtKUser->execute([$kantin_id]);
            $kuser = $stmtKUser->fetch(PDO::FETCH_ASSOC);
            $sekolah_id = $kuser ? $kuser['sekolah_id'] : '';
        } else {
            $sekolah_id = $kantin['sekolah_id'];
        }

        // 2. Ambil nama siswa dari tabel siswa atau users sebagai pemberi feedback
        $nama_siswa = "Siswa";
        if (!empty($siswa_id)) {
            $stmtSiswa = $db->prepare("SELECT nama FROM siswa WHERE id = ? OR user_id = ? LIMIT 1");
            $stmtSiswa->execute([$siswa_id, $siswa_id]);
            $siswaRow = $stmtSiswa->fetch(PDO::FETCH_ASSOC);
            if ($siswaRow) {
                $nama_siswa = $siswaRow['nama'];
            } else {
                $stmtUser = $db->prepare("SELECT nama FROM users WHERE id = ? LIMIT 1");
                $stmtUser->execute([$siswa_id]);
                $userRow = $stmtUser->fetch(PDO::FETCH_ASSOC);
                if ($userRow)
                    $nama_siswa = $userRow['nama'];
            }
        }

        // 3. Cari jadwal_distribusi_id untuk kantin & sekolah ini pada hari ini
        $stmtJadwal = $db->prepare("
            SELECT id FROM jadwal_distribusi 
            WHERE kantin_id = ? AND sekolah_id = ? AND tanggal = CURDATE()
            LIMIT 1
        ");
        $stmtJadwal->execute([$kantin_id, $sekolah_id]);
        $jadwal = $stmtJadwal->fetch(PDO::FETCH_ASSOC);
        $jadwal_id = $jadwal ? $jadwal['id'] : '';

        if (empty($jadwal_id)) {
            // Fallback: Ambil jadwal distribusi terakhir untuk kantin ini
            $stmtJadwalLast = $db->prepare("
                SELECT id FROM jadwal_distribusi 
                WHERE kantin_id = ? OR sekolah_id = ?
                ORDER BY tanggal DESC LIMIT 1
            ");
            $stmtJadwalLast->execute([$kantin_id, $sekolah_id]);
            $jadwalLast = $stmtJadwalLast->fetch(PDO::FETCH_ASSOC);
            $jadwal_id = $jadwalLast ? $jadwalLast['id'] : '';
        }

        if (empty($jadwal_id)) {
            // Jika benar-benar kosong, buat jadwal distribusi dummy hari ini agar constraint FK terpenuhi
            $jadwal_id = uniqid();

            // Ambil sppg_id jika ada
            $stmtSppg = $db->query("SELECT id FROM sppg LIMIT 1");
            $sppg = $stmtSppg->fetch(PDO::FETCH_ASSOC);
            $sppg_id = $sppg ? $sppg['id'] : uniqid();

            // Insert dummy SPPG if not exist to satisfy FK
            if (!$sppg) {
                $stmtInsSppg = $db->prepare("INSERT INTO sppg (id, nama_lembaga, user_id, kode_sppg) VALUES (?, 'SPPG Pusat', ?, 'SPPG_DUMMY')");
                $stmtInsSppg->execute([$sppg_id, uniqid()]);
            }

            $stmtInsJadwal = $db->prepare("
                INSERT INTO jadwal_distribusi (id, sppg_id, sekolah_id, kantin_id, tanggal, sesi, status)
                VALUES (?, ?, ?, ?, CURDATE(), 'siang', 'completed')
            ");
            $stmtInsJadwal->execute([$jadwal_id, $sppg_id, $sekolah_id, $kantin_id]);
        }

        // 4. Pastikan kolom photo & siswa_id ada pada tabel feedback_kantin
        try {
            $db->query("SELECT photo FROM feedback_kantin LIMIT 1");
        } catch (Exception $e) {
            $db->exec("ALTER TABLE feedback_kantin ADD COLUMN photo VARCHAR(255) DEFAULT NULL");
        }
        try {
            $db->query("SELECT siswa_id FROM feedback_kantin LIMIT 1");
        } catch (Exception $e) {
            $db->exec("ALTER TABLE feedback_kantin ADD COLUMN siswa_id CHAR(36) DEFAULT NULL");
        }
        try {
            $db->query("SELECT transaksi_id FROM feedback_kantin LIMIT 1");
        } catch (Exception $e) {
            $db->exec("ALTER TABLE feedback_kantin ADD COLUMN transaksi_id VARCHAR(50) DEFAULT NULL");
        }

        // 5. Tangani Upload Foto
        $photo_filename = null;
        if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
            $target_dir = __DIR__ . '/../../uploads/';
            if (!file_exists($target_dir)) {
                mkdir($target_dir, 0777, true);
            }

            $file_extension = pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION);
            if (empty($file_extension))
                $file_extension = 'jpg';

            $photo_filename = 'feedback_' . uniqid() . '.' . $file_extension;
            $target_file = $target_dir . $photo_filename;

            move_uploaded_file($_FILES['photo']['tmp_name'], $target_file);
        }

        // 6. Simpan feedback ke database
        $feedback_id = uniqid();
        $stmtInsert = $db->prepare("
            INSERT INTO feedback_kantin (id, sekolah_id, kantin_id, jadwal_id, rating, komentar, petugas_penerima, photo, siswa_id, transaksi_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmtInsert->execute([
            $feedback_id,
            $sekolah_id,
            $kantin_id,
            $jadwal_id,
            $rating,
            $review,
            $nama_siswa, // Simpan nama pengirim di petugas_penerima
            $photo_filename,
            $siswa_id,
            $transaksi_id
        ]);

        echo json_encode([
            "status" => "success",
            "message" => "Feedback Anda berhasil dikirim!"
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>