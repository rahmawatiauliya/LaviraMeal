<?php
header("Content-Type: application/json");
include_once __DIR__ . '/../shared/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    $idnt = !empty($data->email) ? $data->email : (!empty($data->identifier) ? $data->identifier : null);

    // Kita gunakan 'identifier' atau 'email' agar fleksibel
    if (!empty($idnt) && !empty($data->password)) {

        try {
            // QUERY SAKTI: Mendukung Login untuk semua role (SPPG, Sekolah, Siswa, Kantin, Guru)
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
                      WHERE (u.username = :idnt1 OR u.email = :idnt2 OR ss.nis = :idnt3) 
                      LIMIT 1";

            $stmt = $db->prepare($query);
            $stmt->bindParam(":idnt1", $idnt);
            $stmt->bindParam(":idnt2", $idnt);
            $stmt->bindParam(":idnt3", $idnt);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $row = $stmt->fetch(PDO::FETCH_ASSOC);

                if (password_verify($data->password, $row['password_hash'])) {
                    
                    // Cek apakah akun aktif
                    if ($row['is_active'] == 0) {
                        http_response_code(403);
                        echo json_encode([
                            "status" => "error", 
                            "message" => "Akun Anda sedang menunggu persetujuan (ACC) dari admin SPPG. Silakan cek berkala."
                        ]);
                        exit;
                    }

                    // Update Waktu Login
                    $db->prepare("UPDATE users SET last_login = NOW() WHERE id = ?")->execute([$row['id']]);

                    unset($row['password_hash']); // Keamanan

                    http_response_code(200);
                    echo json_encode([
                        "status" => "success",
                        "message" => "Selamat datang di Lavira Meal Karawang!",
                        "user" => $row
                    ]);
                }
                else {
                    http_response_code(401);
                    echo json_encode(["status" => "error", "message" => "Password salah."]);
                }
            }
            else {
                http_response_code(401);
                echo json_encode(["status" => "error", "message" => "Akun tidak ditemukan."]);
            }
        }
        catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                "status" => "error", 
                "message" => "Database error: " . $e->getMessage(),
                "query_debug" => $query // Opsi tambahan untuk debug internal
            ]);
        }
    }
    else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Identifier (Email/NIS) dan Password harus diisi."]);
    }
}
else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>
