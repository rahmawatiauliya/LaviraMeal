<?php
header("Content-Type: application/json; charset=UTF-8");
include_once __DIR__ . '/../shared/config.php';

try {
    $sekolah_id = 'c53954da-a1a2-43eb-9ad7-ab51bcd4f0dc';
    $db->exec("INSERT IGNORE INTO menu_kantin (sekolah_id, kantin_name, menu_name, price, image_path) VALUES 
    ('$sekolah_id', 'Kantin Sehat', 'Nasi Ayam Penyet', 15000, 'https://img-global.cpcdn.com/recipes/5341258611181568/680x482cq70/nasi-ayam-penyet-foto-resep-utama.jpg'),
    ('$sekolah_id', 'Kantin Jujur', 'Mie Gacoan Level 1', 12000, 'https://asset.kompas.com/crops/W6d6mQ6I_V6X9C_S-8D1_b8_C_Y=/0x0:1000x667/750x500/data/photo/2022/05/19/6285a8a8a3a7b.jpg'),
    ('$sekolah_id', 'Warung Bu Sri', 'Gado-Gado Spesial', 10000, 'https://awsimages.detik.net.id/community/detikfood/2022/02/02/gado-gado-berbumbu-kacang-yang-gurih-manis_43.jpeg?w=700&q=90')");
    
    echo json_encode(["status" => "success", "message" => "Data dummy berhasil ditambahkan untuk sekolah $sekolah_id"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
