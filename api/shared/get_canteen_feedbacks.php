<?php
include_once __DIR__ . '/config.php';
header("Content-Type: application/json");

$kantin_id = isset($_GET['kantin_id']) ? $_GET['kantin_id'] : null;

if (!$kantin_id) {
    echo json_encode(["status" => "error", "message" => "Kantin ID is required"]);
    exit();
}

try {
    // 1. Ambil list feedback
    $stmt = $db->prepare("
        SELECT id, rating, komentar as review, petugas_penerima as reviewer_name, created_at, photo 
        FROM feedback_kantin 
        WHERE kantin_id = ? 
        ORDER BY created_at DESC
    ");
    $stmt->execute([$kantin_id]);
    $feedbacks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Hitung statistik rating
    $stmtStats = $db->prepare("
        SELECT COUNT(id) as total_feedbacks, AVG(rating) as average_rating 
        FROM feedback_kantin 
        WHERE kantin_id = ?
    ");
    $stmtStats->execute([$kantin_id]);
    $stats = $stmtStats->fetch(PDO::FETCH_ASSOC);

    $total = (int) $stats['total_feedbacks'];
    $avg = $stats['average_rating'] !== null ? round((float) $stats['average_rating'], 1) : 0.0;

    // 3. Hitung jumlah per-bintang
    $stars_count = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
    if ($total > 0) {
        $stmtStars = $db->prepare("
            SELECT rating, COUNT(id) as count 
            FROM feedback_kantin 
            WHERE kantin_id = ? 
            GROUP BY rating
        ");
        $stmtStars->execute([$kantin_id]);
        while ($row = $stmtStars->fetch(PDO::FETCH_ASSOC)) {
            $stars_count[(int)$row['rating']] = (int)$row['count'];
        }
    }

    echo json_encode([
        "status" => "success",
        "stats" => [
            "total_feedbacks" => $total,
            "average_rating" => $avg,
            "stars_distribution" => $stars_count
        ],
        "feedbacks" => $feedbacks
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
