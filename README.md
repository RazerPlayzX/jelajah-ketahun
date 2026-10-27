# Jelajah Ketahun — Peta Saja + Halaman Tambah Gambar (PHP & MySQL)

Website sederhana untuk 11 desa Kecamatan Ketahun, Kabupaten Bengkulu Utara, Bengkulu. **Tidak ada login, header, navbar, sidebar, maupun direktori desa.** Halaman pertama langsung menampilkan peta memenuhi layar.

## Apa yang tersedia?

- **`index.php`**: peta interaktif penuh layar, 11 penanda desa, pencarian desa melalui kotak kecil di atas peta, layer Jalan/Satelit, dan tombol menampilkan semua desa.
- **Klik penanda desa**: tampil pratinjau foto, nama desa, dan deskripsi. Klik **Lihat informasi & galeri** untuk foto tambahan dan koordinat rujukan.
- **Satu tombol `Tambah Gambar`** pada peta: mengarah ke **`tambah-foto.php`**, halaman terpisah (bukan popup) dengan daftar pilihan 11 desa, pilihan file, pratinjau, dan kolom keterangan.
- Foto tersimpan sebagai file di `uploads/desa/`, sementara metadata dan informasi desa berada di **MySQL**. Foto dapat dilihat pengunjung lain setelah server diunggah ke hosting publik.
- Tanpa login: tersedia batas **4 MB/file**, **8 foto/desa**, dan **12 unggahan per alamat IP setiap hari**. File harus berformat JPG/PNG/WEBP dan sesuai dengan pemeriksaan tipe sebenarnya.

**Akurasi:** koordinat awal di SQL adalah *titik rujukan/perkiraan*, bukan batas administratif ataupun posisi kantor desa resmi. Perbaiki kolom `villages.lat` dan `villages.lng` menggunakan data GPS yang kamu verifikasi. Jangan menganggap marker sebagai titik presisi administratif.

## Cara menjalankan di Laragon (instalasi baru)

1. Ekstrak folder `jelajah-ketahun` dari ZIP ke `C:\laragon\www\jelajah-ketahun\`.
2. Di Laragon klik **Start All** supaya **Apache** dan **MySQL** berjalan.
3. Di **HeidiSQL / phpMyAdmin**, jalankan `database.sql`. File tersebut membuat database `jelajah_ketahun`, tabel `villages`, `village_photos`, dan `upload_limits`, serta 11 desa.
4. Cek file **`config.php`**: alamat `127.0.0.1`, port `3306`, user `root`, password kosong adalah konfigurasi Laragon yang umum. Jika milikmu berbeda, sesuaikan.
5. Buka **`http://localhost/jelajah-ketahun/`** (atau `http://jelajah-ketahun.test/` jika Laragon Auto Virtual Hosts aktif).
6. Klik satu-satunya tombol **Tambah Gambar** untuk membuka **`tambah-foto.php`**. Pilih desa, masukkan foto dan keterangannya, lalu klik **Unggah gambar**.
7. Setelah sukses, tekan **Lihat desa di peta** untuk menuju marker desa dengan foto barunya.

### Kalau biasa membuka `localhost:8000`

Buka terminal **di dalam folder proyek `jelajah-ketahun`** kemudian jalankan:

```bash
php -S localhost:8000
```

Buka `http://localhost:8000/`. **MySQL Laragon harus tetap aktif.** Server PHP bawaan ini hanya untuk tes lokal, karena tidak mendukung aturan `.htaccess` Apache untuk perlindungan file konfigurasi dan folder upload.

## Jika sudah pernah memakai versi sebelumnya

- **Jangan menghapus database atau file foto lama.** Kode baru memakai tabel yang sama (`villages`, `village_photos`, `upload_limits`).
- Jika database belum memiliki tabel `upload_limits`, jalankan `upgrade_database_lama.sql` melalui HeidiSQL/phpMyAdmin.
- Ganti file aplikasi dengan versi baru, tetapi pertahankan isi folder `uploads/desa/` lama.
- Tabel `admin_users` lama boleh tetap ada di database, tetapi tidak digunakan. Tidak ada login atau admin di versi ini.
- Ketika MySQL belum tersambung, peta mencoba menampilkan **11 penanda rujukan sementara** (jika Leaflet dapat diunduh). Unggah gambar memerlukan MySQL aktif.

## Peta kosong / gambar dasar tidak tampil

Peta memakai **Leaflet 1.9.4** yang dimuat dari CDN (ada fallback CDN), jalan dari OpenStreetMap, satelit dari Esri. Jadi **memerlukan internet** untuk peta dasar.

1. Uji tombol **Jalan** dan **Satelit**.
2. Tekan **F12 → Network / Console**, lihat error untuk `leaflet.js`, `leaflet.css`, `tile.openstreetmap.org`, dan `server.arcgisonline.com`.
3. Jika ada pesan koneksi database di peta, periksa `config.php`, instalasi `database.sql`, serta Laragon MySQL.
4. Ekstensi adblocker, pengaturan firewall, DNS, atau koneksi jaringan mungkin memblokir CDN atau tile server. Coba jaringan lain.
5. Ketika gambar dasar gagal, marker bisa tetap terlihat di atas latar kosong selama Leaflet berhasil diunduh. Ini bukan berarti posisi desanya hilang.

## Agar dapat dilihat orang lain melalui internet

Untuk situs publik, pakai hosting **PHP 8.1+**, **MySQL/MariaDB**, serta Apache dengan `.htaccess` (atau aturan server web setara). Hosting HTML statis seperti GitHub Pages **tidak mendukung backend PHP + MySQL**.

1. Buat database di panel hosting, lalu jalankan `hosting_schema.sql` **pada database hosting tersebut** (versi ini tidak membuat database karena database hosting sudah ada).
2. Unggah folder proyek ke `public_html` dan sesuaikan kredensial database pada `config.php`.
3. Ubah `upload_salt` pada `config.php` menjadi string rahasia acak panjang. Jangan unggah file konfigurasi ke repositori publik.
4. Pastikan `uploads/desa/` writable, serta modul `pdo_mysql`, `fileinfo`, dan `session` aktif; PHP `upload_max_filesize` dan `post_max_size` lebih dari 4 MB.
5. Akses domain publik, pastikan marker, gambar dasar, dan fitur unggah bekerja.

**Keamanan:** tanpa login, siapa saja yang mengunjungi halaman tambah gambar bisa mengirim foto. Validasi ukuran, MIME, dimensi gambar, nama berkas acak, limit unggahan, dan `.htaccess` sudah disiapkan; namun **belum ada moderasi**. Sebelum dipublikasikan luas, sangat disarankan menambah CAPTCHA, moderasi unggahan, backup, monitoring penyalahgunaan, dan konfigurasi rate limit server. Foto yang salah unggah dapat dihapus manual melalui HeidiSQL (hapus metadata) dan File Manager (hapus file dengan nama yang sama).

## Struktur proyek

```text
jelajah-ketahun/
├── index.php                    # Hanya peta, 1 tombol tambah gambar
├── tambah-foto.php              # Halaman unggah gambar tersendiri
├── assets/
│   ├── styles.css               # Tampilan peta dan halaman unggah
│   ├── map.js                   # Interaksi marker, pencarian, popup, galeri
│   └── upload.js                # Pilihan desa, preview, unggah via API
├── api/
│   ├── bootstrap.php
│   ├── villages.php             # Baca informasi desa dan foto
│   └── upload.php               # Terima gambar, simpan file + data SQL
├── config.php                   # Koneksi MySQL
├── database.sql                 # Instalasi baru Laragon
├── hosting_schema.sql           # SQL untuk hosting dengan DB yang sudah dibuat
├── upgrade_database_lama.sql    # Migrasi dari versi lama
└── uploads/desa/               # Foto yang diunggah
```
