-- Untuk pengguna versi PHP+MySQL terdahulu, jalankan sekali di HeidiSQL/phpMyAdmin.
USE `jelajah_ketahun`;
CREATE TABLE IF NOT EXISTS upload_limits (
  ip_hash CHAR(64) NOT NULL,
  upload_date DATE NOT NULL,
  uploads SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, upload_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Tidak perlu menghapus data desa dan foto lama. Tabel admin_users lama boleh dibiarkan.
