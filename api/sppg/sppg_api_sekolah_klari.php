<?php
include_once __DIR__ . '/../shared/config.php';

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Menambahkan data sekolah di berbagai desa se-Kecamatan Klari, Karawang
$sekolah_klari = [
    // Desa Duren
    ['nama' => 'SDN Duren 1', 'npsn' => '20219801', 'alamat' => 'Jl. Raya Klari Kosambi No. 1, Desa Duren, Kec. Klari, Kab. Karawang'],
    ['nama' => 'SDN Duren 2', 'npsn' => '20219802', 'alamat' => 'Perumahan Griya Indah, Desa Duren, Kec. Klari, Kab. Karawang'],
    ['nama' => 'SMPN 1 Klari', 'npsn' => '20219803', 'alamat' => 'Jl. Raya Curug Kosambi, Desa Duren, Kec. Klari, Kab. Karawang'],
    ['nama' => 'SMAN 1 Klari', 'npsn' => '20219804', 'alamat' => 'Perumahan Karawang Timur, Desa Duren, Kec. Klari, Kab. Karawang'],
    ['nama' => 'SMKS Texmaco Karawang', 'npsn' => '20219805', 'alamat' => 'Jl. Raya Kosambi, Desa Duren, Kec. Klari, Kab. Karawang'],

    // Desa Pancawati
    ['nama' => 'SDN Pancawati 1', 'npsn' => '20219806', 'alamat' => 'Jl. Siliwangi No. 45, Desa Pancawati, Kec. Klari, Kab. Karawang'],
    ['nama' => 'SDN Pancawati 2', 'npsn' => '20219807', 'alamat' => 'Dusun Krajan, Desa Pancawati, Kec. Klari, Kab. Karawang'],
    ['nama' => 'SMP Al-Irsyad Pancawati', 'npsn' => '20219808', 'alamat' => 'Jl. Raya Pancawati, Kec. Klari, Kab. Karawang'],

    // Desa Walahar
    ['nama' => 'SDN Walahar 1', 'npsn' => '20219809', 'alamat' => 'Jl. Bendungan Walahar, Desa Walahar, Kec. Klari, Kab. Karawang'],
    ['nama' => 'SDN Walahar 2', 'npsn' => '20219810', 'alamat' => 'Kampung Walahar, Desa Walahar, Kec. Klari, Kab. Karawang'],
    ['nama' => 'SMPN 2 Klari', 'npsn' => '20219811', 'alamat' => 'Jl. Bendungan Walahar, Kec. Klari, Kab. Karawang'],

    // Desa Gintungkerta
    ['nama' => 'SDN Gintungkerta 1', 'npsn' => '20219812', 'alamat' => 'Jl. Desa Gintungkerta RT 01/02, Kec. Klari, Kab. Karawang'],
    ['nama' => 'SDN Gintungkerta 2', 'npsn' => '20219813', 'alamat' => 'Perumahan Gintung Indah, Desa Gintungkerta, Kec. Klari, Kab. Karawang'],

    // Desa Anggadita
    ['nama' => 'SDN Anggadita 1', 'npsn' => '20219814', 'alamat' => 'Jl. Anggadita Raya No. 12, Desa Anggadita, Kec. Klari, Kab. Karawang'],
    ['nama' => 'SMP IT Anggadita', 'npsn' => '20219815', 'alamat' => 'Dusun Jati, Desa Anggadita, Kec. Klari, Kab. Karawang'],

    // Desa Klari (Pusat Kecamatan)
    ['nama' => 'SDN Klari 1', 'npsn' => '20219816', 'alamat' => 'Jl. Pembangunan No. 1, Desa Klari, Kec. Klari, Kab. Karawang'],
    ['nama' => 'SDN Klari 2', 'npsn' => '20219817', 'alamat' => 'Perum Klari Indah, Kec. Klari, Kab. Karawang'],

    // Desa Kiarapayung
    ['nama' => 'SDN Kiarapayung 1', 'npsn' => '20219818', 'alamat' => 'Jalan Desa Kiarapayung, Kec. Klari, Kab. Karawang'],
];

echo json_encode(['status' => 'success', 'data' => $sekolah_klari]);
?>
