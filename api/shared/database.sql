-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: lavirameal_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sekolah_id` char(36) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `message` varchar(255) DEFAULT 'Lainnya',
  `detail` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sekolah_id` (`sekolah_id`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`sekolah_id`) REFERENCES `sekolah` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dana_kaget`
--

DROP TABLE IF EXISTS `dana_kaget`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dana_kaget` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sekolah_id` char(36) NOT NULL,
  `amount` int(11) NOT NULL,
  `quota` int(11) NOT NULL,
  `claimed_count` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sekolah_id` (`sekolah_id`),
  CONSTRAINT `dana_kaget_ibfk_1` FOREIGN KEY (`sekolah_id`) REFERENCES `sekolah` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dana_kaget_claims`
--

DROP TABLE IF EXISTS `dana_kaget_claims`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dana_kaget_claims` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dana_kaget_id` int(11) NOT NULL,
  `user_id` char(36) NOT NULL,
  `claimed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `dana_kaget_id` (`dana_kaget_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `dana_kaget_claims_ibfk_1` FOREIGN KEY (`dana_kaget_id`) REFERENCES `dana_kaget` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dana_kaget_claims_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `distribusi_detail`
--

DROP TABLE IF EXISTS `distribusi_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `distribusi_detail` (
  `id` char(36) NOT NULL,
  `jadwal_id` char(36) NOT NULL,
  `menu_id` char(36) NOT NULL,
  `jumlah_porsi` int(11) NOT NULL DEFAULT 0,
  `harga_at_snapshot` decimal(12,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `jadwal_id` (`jadwal_id`),
  KEY `menu_id` (`menu_id`),
  CONSTRAINT `distribusi_detail_ibfk_1` FOREIGN KEY (`jadwal_id`) REFERENCES `jadwal_distribusi` (`id`) ON DELETE CASCADE,
  CONSTRAINT `distribusi_detail_ibfk_2` FOREIGN KEY (`menu_id`) REFERENCES `menu` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feedback_kantin`
--

DROP TABLE IF EXISTS `feedback_kantin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feedback_kantin` (
  `id` char(36) NOT NULL,
  `sekolah_id` char(36) NOT NULL,
  `kantin_id` char(36) NOT NULL,
  `jadwal_id` char(36) NOT NULL,
  `rating` tinyint(4) DEFAULT 5,
  `komentar` text DEFAULT NULL,
  `petugas_penerima` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sekolah_id` (`sekolah_id`),
  KEY `kantin_id` (`kantin_id`),
  KEY `jadwal_id` (`jadwal_id`),
  CONSTRAINT `feedback_kantin_ibfk_1` FOREIGN KEY (`sekolah_id`) REFERENCES `sekolah` (`id`),
  CONSTRAINT `feedback_kantin_ibfk_2` FOREIGN KEY (`kantin_id`) REFERENCES `kantin` (`id`),
  CONSTRAINT `feedback_kantin_ibfk_3` FOREIGN KEY (`jadwal_id`) REFERENCES `jadwal_distribusi` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `guru`
--

DROP TABLE IF EXISTS `guru`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `guru` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `sekolah_id` char(36) NOT NULL,
  `nip` varchar(30) DEFAULT NULL,
  `nama` varchar(150) NOT NULL,
  `mata_pelajaran` varchar(100) DEFAULT NULL,
  `kelas_wali` varchar(20) DEFAULT NULL,
  `no_telp` varchar(20) DEFAULT NULL,
  `is_aktif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `nip` (`nip`),
  KEY `sekolah_id` (`sekolah_id`),
  CONSTRAINT `guru_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `guru_ibfk_2` FOREIGN KEY (`sekolah_id`) REFERENCES `sekolah` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `jadwal_distribusi`
--

DROP TABLE IF EXISTS `jadwal_distribusi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jadwal_distribusi` (
  `id` char(36) NOT NULL,
  `sppg_id` char(36) NOT NULL,
  `sekolah_id` char(36) NOT NULL,
  `kantin_id` char(36) NOT NULL,
  `dibuat_oleh` char(36) DEFAULT NULL,
  `tanggal` date NOT NULL,
  `sesi` enum('pagi','siang','sore') NOT NULL DEFAULT 'siang',
  `kuota_porsi` int(11) NOT NULL DEFAULT 0,
  `status` enum('draft','published','completed') NOT NULL DEFAULT 'draft',
  `catatan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sppg_id` (`sppg_id`),
  KEY `sekolah_id` (`sekolah_id`),
  KEY `kantin_id` (`kantin_id`),
  KEY `dibuat_oleh` (`dibuat_oleh`),
  CONSTRAINT `jadwal_distribusi_ibfk_1` FOREIGN KEY (`sppg_id`) REFERENCES `sppg` (`id`),
  CONSTRAINT `jadwal_distribusi_ibfk_2` FOREIGN KEY (`sekolah_id`) REFERENCES `sekolah` (`id`),
  CONSTRAINT `jadwal_distribusi_ibfk_3` FOREIGN KEY (`kantin_id`) REFERENCES `kantin` (`id`),
  CONSTRAINT `jadwal_distribusi_ibfk_4` FOREIGN KEY (`dibuat_oleh`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kantin`
--

DROP TABLE IF EXISTS `kantin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kantin` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `sekolah_id` char(36) NOT NULL,
  `nama_kantin` varchar(150) NOT NULL,
  `pemilik` varchar(150) NOT NULL,
  `no_telp` varchar(20) DEFAULT NULL,
  `kapasitas_porsi` int(11) NOT NULL DEFAULT 0,
  `is_aktif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `sekolah_id` (`sekolah_id`),
  CONSTRAINT `kantin_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `kantin_ibfk_2` FOREIGN KEY (`sekolah_id`) REFERENCES `sekolah` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `konsumsi_siswa`
--

DROP TABLE IF EXISTS `konsumsi_siswa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `konsumsi_siswa` (
  `id` char(36) NOT NULL,
  `siswa_id` char(36) NOT NULL,
  `jadwal_id` char(36) NOT NULL,
  `menu_id` char(36) NOT NULL,
  `dicatat_oleh` char(36) DEFAULT NULL,
  `hadir` tinyint(1) NOT NULL DEFAULT 0,
  `makan` tinyint(1) NOT NULL DEFAULT 0,
  `waktu_scan` timestamp NULL DEFAULT NULL,
  `catatan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `siswa_id` (`siswa_id`),
  KEY `jadwal_id` (`jadwal_id`),
  KEY `menu_id` (`menu_id`),
  KEY `dicatat_oleh` (`dicatat_oleh`),
  CONSTRAINT `konsumsi_siswa_ibfk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE CASCADE,
  CONSTRAINT `konsumsi_siswa_ibfk_2` FOREIGN KEY (`jadwal_id`) REFERENCES `jadwal_distribusi` (`id`) ON DELETE CASCADE,
  CONSTRAINT `konsumsi_siswa_ibfk_3` FOREIGN KEY (`menu_id`) REFERENCES `menu` (`id`),
  CONSTRAINT `konsumsi_siswa_ibfk_4` FOREIGN KEY (`dicatat_oleh`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `menu`
--

DROP TABLE IF EXISTS `menu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `menu` (
  `id` char(36) NOT NULL,
  `kantin_id` char(36) NOT NULL,
  `nama_menu` varchar(200) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `kalori` decimal(8,2) DEFAULT NULL,
  `protein` decimal(8,2) DEFAULT NULL,
  `karbohidrat` decimal(8,2) DEFAULT NULL,
  `lemak` decimal(8,2) DEFAULT NULL,
  `serat` decimal(8,2) DEFAULT NULL,
  `foto_url` text DEFAULT NULL,
  `harga_satuan` decimal(12,2) NOT NULL DEFAULT 0.00,
  `tersedia` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `kantin_id` (`kantin_id`),
  CONSTRAINT `menu_ibfk_1` FOREIGN KEY (`kantin_id`) REFERENCES `kantin` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `menu_kantin`
--

DROP TABLE IF EXISTS `menu_kantin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `menu_kantin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sekolah_id` char(36) NOT NULL,
  `kantin_name` varchar(100) NOT NULL,
  `menu_name` varchar(255) NOT NULL,
  `menu_description` text DEFAULT NULL,
  `price` decimal(12,2) DEFAULT 0.00,
  `image_path` varchar(255) DEFAULT NULL,
  `tanggal` date DEFAULT curdate(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `sekolah_id` (`sekolah_id`),
  CONSTRAINT `menu_kantin_ibfk_1` FOREIGN KEY (`sekolah_id`) REFERENCES `sekolah` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifikasi`
--

DROP TABLE IF EXISTS `notifikasi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifikasi` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `pengirim_id` char(36) DEFAULT NULL,
  `judul` varchar(200) NOT NULL,
  `pesan` text NOT NULL,
  `tipe` enum('info','warning','success','error') NOT NULL DEFAULT 'info',
  `referensi_id` char(36) DEFAULT NULL,
  `referensi_tabel` varchar(50) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `pengirim_id` (`pengirim_id`),
  CONSTRAINT `notifikasi_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifikasi_ibfk_2` FOREIGN KEY (`pengirim_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sekolah`
--

DROP TABLE IF EXISTS `sekolah`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sekolah` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `sppg_id` char(36) NOT NULL,
  `nama_sekolah` varchar(200) NOT NULL,
  `npsn` varchar(20) NOT NULL,
  `jenjang` enum('PAUD','SD','SMP','SMA','SMK') NOT NULL,
  `alamat` text DEFAULT NULL,
  `kota` varchar(100) DEFAULT NULL,
  `provinsi` varchar(100) DEFAULT NULL,
  `no_telp` varchar(20) DEFAULT NULL,
  `email_sekolah` varchar(150) DEFAULT NULL,
  `jumlah_siswa` int(11) NOT NULL DEFAULT 0,
  `is_aktif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `saldo` decimal(15,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `npsn` (`npsn`),
  KEY `sppg_id` (`sppg_id`),
  CONSTRAINT `sekolah_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sekolah_ibfk_2` FOREIGN KEY (`sppg_id`) REFERENCES `sppg` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `siswa`
--

DROP TABLE IF EXISTS `siswa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `siswa` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `sekolah_id` char(36) NOT NULL,
  `guru_id` char(36) DEFAULT NULL,
  `nis` varchar(30) NOT NULL,
  `nama` varchar(150) NOT NULL,
  `kelas` varchar(20) NOT NULL,
  `saldo` decimal(15,2) DEFAULT 0.00,
  `jenis_kelamin` enum('L','P') DEFAULT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `nama_wali` varchar(150) DEFAULT NULL,
  `no_telp_wali` varchar(20) DEFAULT NULL,
  `qr_code_token` text DEFAULT NULL,
  `aktif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `qr_code_token` (`qr_code_token`) USING HASH,
  KEY `sekolah_id` (`sekolah_id`),
  KEY `guru_id` (`guru_id`),
  CONSTRAINT `siswa_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `siswa_ibfk_2` FOREIGN KEY (`sekolah_id`) REFERENCES `sekolah` (`id`),
  CONSTRAINT `siswa_ibfk_3` FOREIGN KEY (`guru_id`) REFERENCES `guru` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `siswa_pengambilan_mbg`
--

DROP TABLE IF EXISTS `siswa_pengambilan_mbg`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `siswa_pengambilan_mbg` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sekolah_id` char(36) DEFAULT NULL,
  `siswa_id` char(36) DEFAULT NULL,
  `tanggal` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sekolah_id` (`sekolah_id`),
  KEY `siswa_id` (`siswa_id`),
  CONSTRAINT `siswa_pengambilan_mbg_ibfk_1` FOREIGN KEY (`sekolah_id`) REFERENCES `sekolah` (`id`) ON DELETE CASCADE,
  CONSTRAINT `siswa_pengambilan_mbg_ibfk_2` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sppg`
--

DROP TABLE IF EXISTS `sppg`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sppg` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `nama_lembaga` varchar(200) NOT NULL,
  `kode_sppg` varchar(50) NOT NULL,
  `alamat` text DEFAULT NULL,
  `kota` varchar(100) DEFAULT NULL,
  `provinsi` varchar(100) DEFAULT NULL,
  `no_telp` varchar(20) DEFAULT NULL,
  `email_lembaga` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `saldo` decimal(15,2) DEFAULT 75250000.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `kode_sppg` (`kode_sppg`),
  CONSTRAINT `sppg_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transaksi_dana`
--

DROP TABLE IF EXISTS `transaksi_dana`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `transaksi_dana` (
  `id` varchar(50) NOT NULL,
  `sppg_id` char(36) NOT NULL,
  `sekolah_id` char(36) NOT NULL,
  `tanggal` datetime NOT NULL DEFAULT current_timestamp(),
  `nominal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `metode` varchar(50) NOT NULL DEFAULT 'Transfer',
  `status` enum('Berhasil','Pending','Gagal') DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sppg_id` (`sppg_id`),
  KEY `sekolah_id` (`sekolah_id`),
  CONSTRAINT `transaksi_dana_ibfk_1` FOREIGN KEY (`sppg_id`) REFERENCES `sppg` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transaksi_dana_ibfk_2` FOREIGN KEY (`sekolah_id`) REFERENCES `sekolah` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `nama` varchar(150) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` text NOT NULL,
  `role` enum('sppg','sekolah','kantin','guru','siswa') NOT NULL,
  `sekolah_id` char(36) DEFAULT NULL,
  `sppg_id` char(36) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`),
  KEY `sekolah_id` (`sekolah_id`),
  KEY `sppg_id` (`sppg_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`sekolah_id`) REFERENCES `sekolah` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`sppg_id`) REFERENCES `sppg` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-26 13:44:20
