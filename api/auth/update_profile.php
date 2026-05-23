<?php
header("Content-Type: application/json");
include_once __DIR__ . '/../shared/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!empty($data->id) && !empty($data->nama) && !empty($data->email)) {
        try {
            $db->beginTransaction();

            // 1. Update Users Table
            $stmtUser = $db->prepare("UPDATE users SET nama = ?, email = ? WHERE id = ?");
            $stmtUser->execute([$data->nama, $data->email, $data->id]);

            // 2. Update Role-Specific Table
            if ($data->role === 'sekolah' && !empty($data->sekolah_id)) {
                $stmtSekolah = $db->prepare("UPDATE sekolah SET nama_sekolah = ?, npsn = ? WHERE id = ?");
                $stmtSekolah->execute([
                    $data->nama_sekolah ?? $data->displayLembaga, 
                    $data->npsn ?? '', 
                    $data->sekolah_id
                ]);
            } else if ($data->role === 'sppg' && !empty($data->sppg_id)) {
                $stmtSppg = $db->prepare("UPDATE sppg SET nama_lembaga = ? WHERE id = ?");
                $stmtSppg->execute([
                    $data->nama_lembaga ?? $data->displayLembaga, 
                    $data->sppg_id
                ]);
            } else if ($data->role === 'kantin') {
                $stmtKantin = $db->prepare("UPDATE kantin SET nama_kantin = ?, pemilik = ? WHERE user_id = ?");
                $stmtKantin->execute([
                    $data->nama_kantin ?? $data->nama,
                    $data->nama,
                    $data->id
                ]);
            } else if ($data->role === 'guru') {
                $stmtGuru = $db->prepare("UPDATE guru SET nama = ?, no_telp = ? WHERE user_id = ?");
                $stmtGuru->execute([
                    $data->nama,
                    $data->no_telp ?? null,
                    $data->id
                ]);
            } else if ($data->role === 'siswa') {
                $stmtSiswa = $db->prepare("UPDATE siswa SET nama = ? WHERE user_id = ?");
                $stmtSiswa->execute([
                    $data->nama,
                    $data->id
                ]);
            }

            $db->commit();

            echo json_encode([
                "status" => "success",
                "message" => "Profil berhasil diperbarui di database."
            ]);
        } catch (PDOException $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Gagal update database: " . $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Data tidak lengkap."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>
