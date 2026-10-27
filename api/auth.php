<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
session_init();
try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $count = (int) db()->query('SELECT COUNT(*) FROM admin_users')->fetchColumn();
        response(['authenticated' => !empty($_SESSION['admin_id']), 'username' => $_SESSION['admin_username'] ?? null, 'csrf' => csrf(), 'setup_required' => $count === 0]);
    }
    require_method('POST');
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) response(['error' => 'Data formulir tidak valid.'], 422);
    $action = (string) ($data['action'] ?? '');
    if ($action === 'login') {
        // Pembatasan sederhana per sesi, bukan pengganti rate-limit tingkat reverse proxy.
        if (($_SESSION['lock_until'] ?? 0) > time()) response(['error' => 'Terlalu banyak percobaan. Coba lagi setelah 10 menit.'], 429);
        $stmt = db()->prepare('SELECT id, username, password_hash FROM admin_users WHERE username = ? LIMIT 1');
        $stmt->execute([(string) ($data['username'] ?? '')]);
        $user = $stmt->fetch();
        if (!$user || !password_verify((string) ($data['password'] ?? ''), $user['password_hash'])) {
            $_SESSION['login_failures'] = (int) ($_SESSION['login_failures'] ?? 0) + 1;
            if ($_SESSION['login_failures'] >= 5) $_SESSION['lock_until'] = time() + 600;
            response(['error' => 'Nama pengguna atau kata sandi salah.'], 401);
        }
        session_regenerate_id(true);
        $_SESSION['admin_id'] = (int) $user['id'];
        $_SESSION['admin_username'] = $user['username'];
        $_SESSION['login_failures'] = 0;
        $_SESSION['lock_until'] = 0;
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        response(['ok' => true, 'csrf' => csrf()]);
    }
    if ($action === 'logout') {
        require_admin();
        if (!hash_equals(csrf(), (string)($data['csrf'] ?? ''))) response(['error' => 'Token keamanan salah.'], 419);
        $_SESSION = [];
        session_regenerate_id(true);
        response(['ok' => true]);
    }
    response(['error' => 'Aksi tidak dikenal.'], 422);
} catch (Throwable $e) { public_api_error($e); }
