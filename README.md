# Jelajah Ketahun — Peta Interaktif 11 Desa

Aplikasi peta interaktif berbasis **PHP, MySQL, JavaScript, dan Leaflet** untuk mengenalkan desa-desa di **Kecamatan Ketahun, Kabupaten Bengkulu Utara**. Pengunjung dapat memilih tampilan jalan/satelit, mencari desa, membuka informasi lokasi, dan membagikan foto desa melalui halaman khusus tanpa login.

> **Status:** Proyek siap dikembangkan dan diuji di Laragon serta dipasang pada hosting PHP + MySQL. Koordinat dalam database adalah titik rujukan/perkiraan; belum merupakan batas wilayah atau kantor desa yang sudah diverifikasi. Upload publik tanpa login perlu moderasi tambahan sebelum website digunakan secara luas.

## Fitur

- Peta fullscreen dengan 11 titik desa dan popup foto/informasi.
- Lapisan jalan dan satelit.
- Pencarian desa tanpa sidebar, direktori, header, atau navbar.
- **Satu tombol Tambah Gambar** menuju halaman `tambah-foto.php` (bukan popup).
- Pilih desa, pratinjau foto, unggah foto JPG/PNG/WEBP dan isi keterangan.
- Penyimpanan foto ke `uploads/desa/` dan metadata ke database MySQL.
- Tanpa login atau dashboard admin.

## Cakupan desa

Bukit Indah · Bukit Tinggi · Dusun Raja · Fajar Baru · Giri Kencana · Kuala Langi · Lubuk Mindai · Melati Harjo · Pasar Ketahun · Talang Baru · Urai.

## Teknologi

| Komponen | Teknologi |
| --- | --- |
| Antarmuka | HTML, CSS, JavaScript |
| Peta | Leaflet + tile OpenStreetMap/Esri (perlu koneksi internet) |
| Backend | PHP (PDO MySQL) |
| Database | MySQL / MariaDB |
| Lokal | Laragon |
| Hosting | Hosting PHP + MySQL seperti InfinityFree |

## Menjalankan di Laragon

1. Clone/download repository ke `C:\laragon\www\jelajah-ketahun`.
2. Jalankan Apache dan MySQL dari Laragon.
3. Buka HeidiSQL/phpMyAdmin, import `database/laragon_setup.sql` untuk membuat database dan mengisi 11 desa.
4. Duplikat `config.example.php` menjadi **`config.php`**, lalu sesuaikan kredensial MySQL. Isi `upload_salt` dengan nilai acak sendiri. Dari Laragon Terminal, jalankan: `php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"`.
5. Akses `http://localhost/jelajah-ketahun/` atau `http://jelajah-ketahun.test/` apabila auto virtual host Laragon aktif.
6. Coba peta, klik marker, dan tambah satu foto pengujian.

**Jangan pernah `git add -f config.php`.** Berkas `config.php` sudah dikecualikan oleh `.gitignore`.

## Deploy ke hosting PHP + MySQL

1. Buat hosting/subdomain dan database MySQL dari Control Panel hosting (contoh: InfinityFree).
2. Import **`database/schema.sql`** ke database hosting yang telah dibuat (tidak perlu `CREATE DATABASE`).
3. Di komputer, salin `config.example.php` ke `config.php`; isi nilai MySQL hosting (hostname, database, username, password) dan `upload_salt` acak.
4. Upload **file aplikasi pada root repo** (`index.php`, `tambah-foto.php`, `api/`, `assets/`, `uploads/`, `.htaccess`, dan `config.php`) langsung ke `htdocs/` hosting. **Jangan unggah** `.git/`, `database/`, atau `config.example.php` bila tidak diperlukan.
5. Pastikan folder `uploads/desa` tersedia dan dapat ditulisi PHP. Jangan menghapus foto lama ketika deploy ulang.
6. Uji akses HTTPS, peta, dan unggah foto dari browser lain.

**Penting:** GitHub menyimpan kode, bukan server PHP. Push ke GitHub **tidak otomatis men-deploy** ke InfinityFree. Upload perubahan secara manual lewat File Manager/FTP kecuali nanti dibuat sistem deployment terpisah.

## Upload pembaruan ke GitHub

Pertama kali (buat dulu repository GitHub kosong, tanpa README dan `.gitignore` bawaan):

```bash
git init -b main
git add .
git commit -m "Initial commit: Jelajah Ketahun interactive map"
git remote add origin https://github.com/USERNAME/jelajah-ketahun.git
git push -u origin main
```

Berikutnya:

```bash
git add .
git commit -m "Update fitur Jelajah Ketahun"
git push
```

Ganti `USERNAME` dengan username GitHub milikmu. Gunakan otentikasi melalui Git Credential Manager/browser saat diminta, bukan membagikan password atau token di repository.

## Struktur berkas

```text
jelajah-ketahun/
├── index.php
├── tambah-foto.php
├── api/
│   ├── bootstrap.php
│   ├── villages.php
│   └── upload.php
├── assets/
│   ├── styles.css
│   ├── map.js
│   └── upload.js
├── uploads/
│   └── desa/              # foto dari user tidak dilacak Git
├── database/
│   ├── laragon_setup.sql
│   └── schema.sql
├── config.example.php     # contoh config tanpa rahasia
├── config.php             # dibuat sendiri, diabaikan oleh Git
├── .htaccess
├── .gitignore
└── README.md
```

## Keamanan dan catatan

- Tanpa login berarti **semua pengunjung dapat mengunggah gambar**. Ada validasi tipe/ukuran dan batas upload dasar, tetapi ini bukan moderasi yang memadai untuk website publik. Pertimbangkan CAPTCHA, moderasi, atau kode akses unggah di versi berikutnya.
- Jangan commit `config.php`, password database, file backup database yang berisi data asli, atau foto orang tanpa izin.
- Peta/koordinat membutuhkan verifikasi lapangan untuk penggunaan resmi.
- Backup database dan berkas di `uploads/desa/` bersamaan agar koleksi foto tetap konsisten.
- Lisensi belum ditetapkan. Repository publik tidak otomatis memberikan izin penggunaan ulang bagi pihak lain.
