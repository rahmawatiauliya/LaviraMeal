<?php
header("Content-Type: application/json");
include_once __DIR__ . '/../shared/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    $siswa_id = $data->siswa_id ?? '';
    $kantin_qr = $data->kantin_qr ?? ''; // Contoh: "KANTI=N-1" atau "1"

    if (empty($siswa_id) || empty($kantin_qr)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Siswa ID dan Data Kantin wajib diisi."]);
        exit;
    }

    try {
        $db->beginTransaction();

        // 1. Ekstrak Kantin ID dari QR
        // Asumsi QR berisi "KANTIN-{ID}" atau hanya "{ID}"
        $kantin_identifier = str_ireplace(['KANTIN-', 'K-'], '', $kantin_qr);

        // Cari Kantin berdasarkan ID atau user_id atau nama
        $stmtKantin = $db->prepare("SELECT id, nama_kantin, sekolah_id FROM kantin WHERE id = ? OR user_id = ? OR nama_kantin LIKE ? LIMIT 1");
        $stmtKantin->execute([$kantin_identifier, $kantin_identifier, "%$kantin_identifier%"]);
        $kantin = $stmtKantin->fetch(PDO::FETCH_ASSOC);

        if (!$kantin) {
            throw new Exception("Data Kantin tidak ditemukan untuk QR: " . $kantin_qr);
        }
        $kantin_id = $kantin['id'];
        $nama_kantin = $kantin['nama_kantin'];

        // 2. Cek Data Siswa
        $stmtSiswa = $db->prepare("SELECT id, saldo, nama, sekolah_id FROM siswa WHERE user_id = ? OR id = ? LIMIT 1");
        $stmtSiswa->execute([$siswa_id, $siswa_id]);
        $siswa = $stmtSiswa->fetch(PDO::FETCH_ASSOC);

        if (!$siswa) {
            throw new Exception("Data Siswa tidak valid.");
        }
        $real_siswa_id = $siswa['id'];
        $saldo_siswa = (float) $siswa['saldo'];

        // 3. Validasi Saldo
        $nominal_transaksi = 1; // 1 PTS per transaksi
        if ($saldo_siswa < $nominal_transaksi) {
            throw new Exception("Poin tidak mencukupi. (Saldo: $saldo_siswa PTS, Butuh: $nominal_transaksi PTS)");
        }

        // 4. Ambil Menu Terkini Kantin
        $stmtMenu = $db->prepare("SELECT id, nama_menu FROM menu_harian WHERE kantin_id = ? ORDER BY tanggal DESC LIMIT 1");
        $stmtMenu->execute([$kantin_id]);
        $menu_makanan = $stmtMenu->fetch(PDO::FETCH_ASSOC);
        $nama_menu = $menu_makanan ? $menu_makanan['nama_menu'] : 'Paket Makan LaviraMeal';

        // 5. Potong Saldo Siswa
        $stmtPotong = $db->prepare("UPDATE siswa SET saldo = saldo - ? WHERE id = ?");
        $stmtPotong->execute([$nominal_transaksi, $real_siswa_id]);

        // 6. Tambah Saldo Kantin
        try {
            $db->query("SELECT saldo FROM kantin LIMIT 1");
        } catch (Exception $e) {
            $db->exec("ALTER TABLE kantin ADD COLUMN saldo DECIMAL(15,2) DEFAULT 0");
        }
        $stmtTambah = $db->prepare("UPDATE kantin SET saldo = saldo + ? WHERE id = ?");
        $stmtTambah->execute([$nominal_transaksi, $kantin_id]);

        // 7. Catat Riwayat
        $message = "Makan di Kantin $nama_kantin ($nama_menu)";
        $stmtTrans = $db->prepare("
            INSERT INTO transaksi_siswa (siswa_id, kantin_id, type, category, nominal, message) 
            VALUES (?, ?, 'keluar', 'Makan', ?, ?)
        ");
        $stmtTrans->execute([$real_siswa_id, $kantin_id, $nominal_transaksi, $message]);

        $db->commit();

        echo json_encode([
            "status" => "success",
            "message" => "Transaksi berhasil",
            "kantin_name" => $nama_kantin,
            "kantin_id" => $kantin_id,
            "menu_name" => $nama_menu,
            "deducted" => $nominal_transaksi
        ]);

    } catch (Exception $e) {
        if ($db->inTransaction())
            $db->rollBack();
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>