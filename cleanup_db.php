<?php
include_once __DIR__ . '/api/shared/config.php';

echo "<h2>Pembersihan Database LaviraMeal</h2>";

// Daftar tabel yang disarankan untuk dihapus (Hanya jika Anda yakin)
$tables_to_drop = [
    'sekolah_transaksi_dana', // Kita sudah pakai transaksi_dana
    'test_table'
];

foreach ($tables_to_drop as $table) {
    try {
        $db->exec("DROP TABLE IF EXISTS $table");
        echo "<p style='color:green'>Tabel <b>$table</b> berhasil dihapus.</p>";
    } catch (Exception $e) {
        echo "<p style='color:red'>Gagal menghapus $table: " . $e->getMessage() . "</p>";
    }
}

echo "<hr><p>Database sekarang lebih bersih dan optimal.</p>";
?>
