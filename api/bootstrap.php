<?php
declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');

$config = require dirname(__DIR__) . '/config.php';

function db(): PDO {
    static $pdo = null;
    global $config;
    if ($pdo instanceof PDO) return $pdo;
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_port'], $config['db_name']);
    return $pdo = new PDO($dsn, $config['db_user'], $config['db_password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}

function session_init(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    session_set_cookie_params(['httponly' => true, 'secure' => $secure, 'samesite' => 'Lax', 'path' => '/']);
    session_start();
    if (empty($_SESSION['csrf_token'])) $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

function response(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function require_method(string $method): void {
    if ($_SERVER['REQUEST_METHOD'] !== $method) response(['error' => 'Metode tidak didukung.'], 405);
}
function verify_csrf(): void {
    session_init();
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['csrf_token'] ?? '');
    if (!is_string($token) || !hash_equals((string) $_SESSION['csrf_token'], $token)) response(['error' => 'Token keamanan tidak valid. Muat ulang halaman.'], 419);
}
function csrf(): string { session_init(); return (string) $_SESSION['csrf_token']; }
function clean(string $s, int $max): string { $s = trim($s); if ((function_exists('mb_strlen') ? mb_strlen($s) : strlen($s)) > $max) response(['error' => "Panjang teks maksimal $max karakter."], 422); return $s; }
function village_exists(string $id): bool {
    $q = db()->prepare('SELECT 1 FROM villages WHERE id = ?'); $q->execute([$id]); return (bool) $q->fetchColumn();
}
function photo_url(string $filename): string {return 'uploads/desa/' . rawurlencode($filename);}
function villages_payload(): array {
    $villages = db()->query('SELECT id, name, lat, lng, area_code, description FROM villages ORDER BY name ASC')->fetchAll();
    $photos = db()->query('SELECT id, village_id, filename, caption FROM village_photos ORDER BY id ASC')->fetchAll();
    $byId = [];
    foreach ($photos as $p) {
        $byId[$p['village_id']][] = ['id' => (int) $p['id'], 'url' => photo_url($p['filename']), 'caption' => $p['caption']];
    }
    foreach ($villages as &$v) {
        $v['lat'] = (float) $v['lat']; $v['lng'] = (float) $v['lng'];
        $v['code'] = $v['area_code']; unset($v['area_code']);
        $v['description'] = $v['description'] ?? '';
        $v['photos'] = $byId[$v['id']] ?? [];
    }
    unset($v);
    return $villages;
}
function public_api_error(Throwable $e): never {
    error_log('[Jelajah Ketahun] ' . $e);
    response(['error' => 'Server database belum siap. Periksa pengaturan MySQL dan impor database.sql.'], 503);
}
