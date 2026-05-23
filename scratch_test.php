<?php
$_POST = [];
$data = [
    "sekolah_id" => "6dcc628d-0a47-499e-ac02-71f306d852a3",
    "type" => "kelas",
    "target_id" => "7-A"
];

// Let's mock the php://input for the include if possible, or just call the file by setting a custom stream or mock.
// Actually, let's write a clean script that simulates exactly what sekolah_process_single_distribution.php does.

include_once __DIR__ . '/api/shared/config.php';

$sekolah_id = $data['sekolah_id'];
$type = $data['type'];
$target_id = $data['target_id'];

try {
    $db->beginTransaction();

    $stmt = $db->prepare("SELECT monthly_amount FROM sekolah_poin_jadwal WHERE sekolah_id = ? AND target_type = ? AND target_identifier = ?");
    $stmt->execute([$sekolah_id, $type, $target_id]);
    $jadwal = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$jadwal) {
        throw new Exception("Jadwal distribusi belum diatur");
    }

    $amount = (float)$jadwal['monthly_amount'];
    echo "Monthly Amount: " . $amount . "\n";

    $stmt = $db->prepare("SELECT saldo FROM sekolah WHERE id = ?");
    $stmt->execute([$sekolah_id]);
    $sekolah = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Sekolah Saldo: " . $sekolah['saldo'] . "\n";

    if ($sekolah['saldo'] < $amount) {
        throw new Exception("Saldo sekolah tidak mencukupi (Butuh $amount PTS)");
    }

    if ($type === 'kelas') {
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM siswa WHERE sekolah_id = ? AND kelas = ?");
        $stmt->execute([$sekolah_id, $target_id]);
        $siswa_count = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        echo "Siswa Count: " . $siswa_count . "\n";

        if ($siswa_count <= 0) throw new Exception("Tidak ada siswa di kelas $target_id");

        $per_siswa = $amount / $siswa_count;
        echo "Per Siswa: " . $per_siswa . "\n";
    }
    
    echo "SUCCESS logic test!\n";
    $db->rollBack();
} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    echo "ERROR: " . $e->getMessage() . "\n";
}
