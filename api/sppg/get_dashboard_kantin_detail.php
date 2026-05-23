<?php
header("Content-Type: application/json");
include_once __DIR__ . '/../shared/config.php';

// Memastikan method request adalah GET atau POST
$kantin_id = isset($_GET['kantin_id']) ? $_GET['kantin_id'] : null;

// Jika menggunakan method POST
$request_method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';
if ($request_method === 'POST') {
    $raw_input = file_get_contents("php://input");
    $data = json_decode($raw_input, true);
    if (!empty($data['kantin_id'])) {
        $kantin_id = $data['kantin_id'];
    }
}

if (!empty($kantin_id)) {
    try {
        // ==========================================
        // FITUR 1: Total Poin Terkumpul (Belum Dicairkan)
        // ==========================================
        // Opsi A: Mengambil langsung dari kolom 'saldo' di tabel kantin
        $stmt_saldo = $db->prepare("SELECT saldo, nama_kantin FROM kantin WHERE id = ?");
        $stmt_saldo->execute([$kantin_id]);
        $kantin_data = $stmt_saldo->fetch(PDO::FETCH_ASSOC);
        
        $total_poin_saldo = 0.00;
        $nama_kantin = "Kantin";
        if ($kantin_data) {
            $total_poin_saldo = (float)$kantin_data['saldo'];
            $nama_kantin = $kantin_data['nama_kantin'];
        }

        // Opsi B: Menghitung total dari log transaksi_siswa yang bertipe 'keluar' (poin dari siswa masuk ke kantin)
        $stmt_total_poin = $db->prepare("
            SELECT SUM(nominal) as total_poin_log 
            FROM transaksi_siswa 
            WHERE kantin_id = ? AND type = 'keluar'
        ");
        $stmt_total_poin->execute([$kantin_id]);
        $total_poin_log = (float)$stmt_total_poin->fetchColumn() ?: 0.00;


        // ==========================================
        // FITUR 2: Daftar Transaksi Siswa Hari Ini (CURRENT_DATE)
        // ==========================================
        $stmt_siswa_hari_ini = $db->prepare("
            SELECT 
                s.nama AS nama_siswa, 
                s.kelas, 
                DATE_FORMAT(ts.created_at, '%H:%i:%s') AS waktu_transaksi, 
                ts.nominal AS jumlah_poin
            FROM transaksi_siswa ts
            JOIN siswa s ON ts.siswa_id = s.id
            WHERE ts.kantin_id = ?
              AND DATE(ts.created_at) = CURRENT_DATE()
              AND ts.type = 'keluar'
            ORDER BY ts.created_at DESC
        ");
        $stmt_siswa_hari_ini->execute([$kantin_id]);
        $siswa_hari_ini = $stmt_siswa_hari_ini->fetchAll(PDO::FETCH_ASSOC);


        // ==========================================
        // FITUR 3: Jam Transaksi Paling Padat Hari Ini
        // ==========================================
        $stmt_jam_padat = $db->prepare("
            SELECT 
                HOUR(ts.created_at) AS jam, 
                COUNT(*) AS total_transaksi
            FROM transaksi_siswa ts
            WHERE ts.kantin_id = ?
              AND DATE(ts.created_at) = CURRENT_DATE()
              AND ts.type = 'keluar'
            GROUP BY HOUR(ts.created_at)
            ORDER BY total_transaksi DESC
        ");
        $stmt_jam_padat->execute([$kantin_id]);
        $jam_padat_list = $stmt_jam_padat->fetchAll(PDO::FETCH_ASSOC);

        // Ambil jam puncak (lonjakan tertinggi) jika ada transaksi hari ini
        $jam_puncak = null;
        if (!empty($jam_padat_list)) {
            $jam_puncak = [
                "jam_format" => sprintf("%02d:00", $jam_padat_list[0]['jam']),
                "total_transaksi" => (int)$jam_padat_list[0]['total_transaksi']
            ];
        }

        // Susun response JSON
        echo json_encode([
            "status" => "success",
            "message" => "Data detail kantin berhasil diambil.",
            "data" => [
                "kantin_id" => $kantin_id,
                "nama_kantin" => $nama_kantin,
                "total_poin" => [
                    "berdasarkan_saldo_aktif" => $total_poin_saldo, // Poin aktif yang belum dicairkan saat ini
                    "berdasarkan_log_transaksi" => $total_poin_log // Akumulasi total poin masuk dari transaksi makan siswa
                ],
                "transaksi_siswa_hari_ini" => $siswa_hari_ini,
                "kepadatan_jam_transaksi" => [
                    "peak_hour" => $jam_puncak, // Jam dengan transaksi terbanyak hari ini
                    "detail_hours" => array_map(function($item) {
                        return [
                            "jam" => sprintf("%02d:00", $item['jam']),
                            "total_transaksi" => (int)$item['total_transaksi']
                        ];
                    }, $jam_padat_list)
                ]
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Kesalahan Database: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Parameter kantin_id tidak ditemukan."]);
}
?>
