<?php
include_once __DIR__ . '/../shared/config.php';

// Membatasi wilayah hanya untuk Karawang sesuai permintaan user
$wilayah = [
    ['id' => 'banyusari', 'nama' => 'Banyusari'],
    ['id' => 'batujaya', 'nama' => 'Batujaya'],
    ['id' => 'ciampel', 'nama' => 'Ciampel'],
    ['id' => 'cibuaya', 'nama' => 'Cibuaya'],
    ['id' => 'cikampek', 'nama' => 'Cikampek'],
    ['id' => 'cilamaya_kulon', 'nama' => 'Cilamaya Kulon'],
    ['id' => 'cilamaya_wetan', 'nama' => 'Cilamaya Wetan'],
    ['id' => 'cilebar', 'nama' => 'Cilebar'],
    ['id' => 'jatisari', 'nama' => 'Jatisari'],
    ['id' => 'jayakerta', 'nama' => 'Jayakerta'],
    ['id' => 'karawang_barat', 'nama' => 'Karawang Barat'],
    ['id' => 'karawang_timur', 'nama' => 'Karawang Timur'],
    ['id' => 'klari', 'nama' => 'Klari'],
    ['id' => 'kotabaru', 'nama' => 'Kotabaru'],
    ['id' => 'kutawaluya', 'nama' => 'Kutawaluya'],
    ['id' => 'lemahabang', 'nama' => 'Lemahabang'],
    ['id' => 'majalaya', 'nama' => 'Majalaya'],
    ['id' => 'pakisjaya', 'nama' => 'Pakisjaya'],
    ['id' => 'pangkalan', 'nama' => 'Pangkalan'],
    ['id' => 'pedes', 'nama' => 'Pedes'],
    ['id' => 'purwasari', 'nama' => 'Purwasari'],
    ['id' => 'rawamerta', 'nama' => 'Rawamerta'],
    ['id' => 'rengasdengklok', 'nama' => 'Rengasdengklok'],
    ['id' => 'tegalwaru', 'nama' => 'Tegalwaru'],
    ['id' => 'telagasari', 'nama' => 'Telagasari'],
    ['id' => 'telukjambe_barat', 'nama' => 'Telukjambe Barat'],
    ['id' => 'telukjambe_timur', 'nama' => 'Telukjambe Timur'],
    ['id' => 'tempuran', 'nama' => 'Tempuran'],
    ['id' => 'tirtajaya', 'nama' => 'Tirtajaya'],
    ['id' => 'tirtamulya', 'nama' => 'Tirtamulya'],
];

echo json_encode(['status' => 'success', 'data' => $wilayah]);
?>
