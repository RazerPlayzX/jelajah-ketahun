<?php
declare(strict_types=1);
require __DIR__ . '/api/bootstrap.php';
session_init();
$error = ''; $complete = false; $ready = false;
try {
    $num = (int) db()->query('SELECT COUNT(*) FROM admin_users')->fetchColumn();
    if ($num > 0) { header('Location: admin.php'); exit; }
    $ready = true;
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $token = (string)($_POST['csrf_token'] ?? '');
        if (!hash_equals(csrf(), $token)) throw new RuntimeException('Token keamanan kedaluwarsa. Coba muat ulang.');
        $username = trim((string)($_POST['username'] ?? ''));
        $password = (string)($_POST['password'] ?? '');
        $confirm = (string)($_POST['confirm_password'] ?? '');
        if (!preg_match('/^[a-zA-Z0-9_-]{4,40}$/', $username)) throw new RuntimeException('Username harus 4–40 karakter (huruf, angka, - atau _).');
        if (strlen($password) < 12 || strlen($password) > 200) throw new RuntimeException('Password harus minimal 12 karakter.');
        if ($password !== $confirm) throw new RuntimeException('Konfirmasi password tidak cocok.');
        $hash = password_hash($password, PASSWORD_DEFAULT);
        // Gunakan locking bernama agar permintaan setup pertama tidak berlomba membuat dua admin.
        $gotLock = (int)db()->query("SELECT GET_LOCK('jelajah_ketahun_setup_first_admin', 5)")->fetchColumn();
        if (!$gotLock) throw new RuntimeException('Setup sedang digunakan. Silakan coba lagi.');
        try {
            if ((int) db()->query('SELECT COUNT(*) FROM admin_users')->fetchColumn() !== 0) throw new RuntimeException('Admin sudah dibuat. Silakan login.');
            $q = db()->prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)');
            $q->execute([$username, $hash]);
            $complete = true;
        } finally { db()->query("SELECT RELEASE_LOCK('jelajah_ketahun_setup_first_admin')"); }
    }
} catch (Throwable $e) {
    $error = $e instanceof PDOException ? 'Database belum terhubung. Impor database.sql dan periksa config.php.' : $e->getMessage();
}
function e(string $s): string { return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
?><!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Setup Admin — Jelajah Ketahun</title><link rel="stylesheet" href="assets/admin.css"></head>
<body class="auth-page"><main class="login-card"><a class="back-link" href="index.php">← Website publik</a><div class="brand-small">✳ jelajah<strong>ketahun</strong></div><p class="kicker">PENGATURAN PERTAMA</p><h1>Buat akun admin</h1><p class="muted">Buat username dan password admin agar hanya kamu yang bisa menambahkan foto, deskripsi, dan memperbaiki koordinat desa.</p>
<?php if ($error): ?><div class="notice error"><?=e($error)?></div><?php endif; ?>
<?php if ($complete): ?><div class="notice success">Admin berhasil dibuat. Halaman setup akan tertutup otomatis setelah akun tersedia.</div><a class="action-link" href="admin.php">Masuk ke dashboard admin →</a>
<?php elseif ($ready): ?><form method="post" autocomplete="off"><input type="hidden" name="csrf_token" value="<?=e(csrf())?>"><label>Username<input name="username" placeholder="misalnya: pengelola_ketahun" required minlength="4" maxlength="40" pattern="[a-zA-Z0-9_-]+"></label><label>Password admin<input name="password" type="password" minlength="12" required autocomplete="new-password" placeholder="Minimal 12 karakter"></label><label>Ulangi password<input name="confirm_password" type="password" minlength="12" required autocomplete="new-password"></label><button class="primary full" type="submit">Buat akun admin</button></form><p class="muted small">Lakukan setup saat masih di Laragon sebelum membuka website ke internet. Jangan gunakan kata sandi database sebagai password admin.</p>
<?php else: ?><p class="muted">Pastikan MySQL aktif, buat database melalui file <code>database.sql</code>, lalu muat ulang halaman.</p><?php endif; ?>
</main></body></html>
