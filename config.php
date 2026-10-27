<?php
// Laragon default: root tanpa password. Untuk server publik, gunakan akun DB khusus + sandi kuat.
// File .php diproses server; jangan gunakan hosting HTML statis untuk proyek ini.
return [
    'db_host' => '127.0.0.1',
    'db_port' => '3306',
    'db_name' => 'jelajah_ketahun',
    'db_user' => 'root',
    'db_password' => '',
    // Ganti dengan string acak rahasia sebelum diunggah ke hosting publik.
    'upload_salt' => 'ganti-nilai-ini-di-hosting-dengan-rangkaian-acak-panjang',
];
