-- Gunakan SETELAH membuat database via cPanel/phpMyAdmin. Jalankan pada database terpilih (tanpa CREATE DATABASE/USE).

CREATE TABLE IF NOT EXISTS villages (
  id VARCHAR(60) NOT NULL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  lat DECIMAL(10,6) NOT NULL,
  lng DECIMAL(10,6) NOT NULL,
  area_code VARCHAR(32) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS village_photos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  village_id VARCHAR(60) NOT NULL,
  filename VARCHAR(90) NOT NULL UNIQUE,
  caption VARCHAR(180) NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_photo_village FOREIGN KEY (village_id) REFERENCES villages(id) ON DELETE CASCADE,
  INDEX idx_village_photo (village_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Titik rujukan desa, BUKAN batas administratif atau posisi kantor desa terverifikasi.
-- Koordinat dapat diperbarui di tabel villages setelah verifikasi sumber lokal.
INSERT IGNORE INTO villages (id, name, lat, lng, area_code, description) VALUES
('bukit-indah','Bukit Indah',-3.356000,101.817900,'17.03.12.2020',NULL),
('bukit-tinggi','Bukit Tinggi',-3.328100,101.833900,'17.03.12.2021',NULL),
('dusun-raja','Dusun Raja',-3.296600,101.830000,'17.03.12.2005',NULL),
('fajar-baru','Fajar Baru',-3.294700,101.805500,'17.03.12.2013',NULL),
('giri-kencana','Giri Kencana',-3.356900,101.839800,'17.03.12.2003',NULL),
('kuala-langi','Kuala Langi',-3.356700,101.790200,'17.03.12.2004',NULL),
('lubuk-mindai','Lubuk Mindai',-3.300300,101.767400,'17.03.12.2012',NULL),
('melati-harjo','Melati Harjo',-3.257400,101.798100,'17.03.12.2019',NULL),
('pasar-ketahun','Pasar Ketahun',-3.374600,101.809900,'17.03.12.2002',NULL),
('talang-baru','Talang Baru',-3.315700,101.820100,'17.03.12.2014',NULL),
('urai','Urai',-3.403900,101.856400,'17.03.12.2001',NULL);

CREATE TABLE IF NOT EXISTS upload_limits (
  ip_hash CHAR(64) NOT NULL,
  upload_date DATE NOT NULL,
  uploads SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, upload_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
