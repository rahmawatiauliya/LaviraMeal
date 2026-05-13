<?php
// Shared config for database connection
date_default_timezone_set('Asia/Jakarta');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Konfigurasi Database
$host = "127.0.0.1"; // Gunakan 127.0.0.1 agar lebih stabil dibanding 'localhost' di beberapa sistem Windows
$db_name = "lavirameal_db";
$username = "root";
$password = "";

try {
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    $db = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password, $options);
}
catch (PDOException $exception) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Gagal terhubung ke database.",
        "detail" => $exception->getMessage()
    ]);
    exit();
}
?>
