<?php
header("Content-Type: text/plain");

// Setup the mock post data
$url = "http://localhost/project_lavirameal/api/kantin/post_menu_harian.php";
$data = [
    'kantin_id' => 'b76d7c17-bbe9-4dde-bc30-1d43addc30d7', // Canteen Tulip ID
    'nama_menu' => 'Nasi Goreng Special Cirebon',
    'deskripsi' => 'Nasi goreng lezat dengan bumbu khas cirebonan, telur mata sapi, dan kerupuk.',
    'tanggal' => date('Y-m-d')
];

// Initialize cURL
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);

// Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP STATUS: $httpCode\n";
echo "RESPONSE:\n";
echo $response . "\n";
?>
