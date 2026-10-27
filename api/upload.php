<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require_method('POST');
verify_csrf();

try {
    $villageId = (string) ($_POST['village_id'] ?? '');
    if (!preg_match('/^[a-z0-9-]{2,60}$/', $villageId) || !village_exists($villageId)) {
        response(['error' => 'Desa tidak ditemukan.'], 404);
    }
    if (!isset($_FILES['photo']) || !is_array($_FILES['photo'])) response(['error' => 'Pilih foto terlebih dahulu.'], 422);
    $file = $_FILES['photo'];
    if (!isset($file['error']) || is_array($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
        response(['error' => 'Gagal mengunggah gambar. Periksa batas upload_max_filesize dan post_max_size di php.ini.'], 413);
    }
    if (!is_uploaded_file($file['tmp_name'])) response(['error' => 'File unggahan tidak sah.'], 422);
    if ((int) $file['size'] > 4 * 1024 * 1024 || (int) $file['size'] < 100) {
        response(['error' => 'Ukuran foto harus antara 100 byte dan 4 MB.'], 413);
    }
    $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    if (!isset($allowed[$mime])) response(['error' => 'Hanya JPG, PNG, dan WEBP yang diperbolehkan.'], 422);
    $info = @getimagesize($file['tmp_name']);
    if (!$info || ($info['mime'] ?? '') !== $mime || $info[0] < 1 || $info[1] < 1 || $info[0] > 6000 || $info[1] > 6000) {
        response(['error' => 'Gambar tidak valid atau dimensinya terlalu besar (maksimal 6000 piksel).'], 422);
    }
    $caption = clean((string) ($_POST['caption'] ?? ''), 180);
    $dir = dirname(__DIR__) . '/uploads/desa';
    if (!is_dir($dir) || !is_writable($dir)) response(['error' => 'Folder uploads/desa tidak dapat ditulisi server PHP.'], 503);
    $filename = bin2hex(random_bytes(24)) . '.' . $allowed[$mime];
    $target = $dir . '/' . $filename;

    global $config;
    $remoteIp = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $ipHash = hash_hmac('sha256', $remoteIp, (string) $config['upload_salt']);
    $pdo = db();
    $pdo->beginTransaction();
    try {
        // Lock desa: menjaga kuota maksimum saat beberapa orang unggah bersamaan.
        $lock = $pdo->prepare('SELECT id FROM villages WHERE id = ? FOR UPDATE');
        $lock->execute([$villageId]);
        if (!$lock->fetch()) { $pdo->rollBack(); response(['error' => 'Desa tidak ditemukan.'], 404); }

        $count = $pdo->prepare('SELECT COUNT(*) FROM village_photos WHERE village_id = ?');
        $count->execute([$villageId]);
        if ((int)$count->fetchColumn() >= 8) { $pdo->rollBack(); response(['error' => 'Desa ini sudah memiliki 8 foto.'], 422); }

        $pdo->prepare('INSERT IGNORE INTO upload_limits (ip_hash, upload_date, uploads) VALUES (?, CURDATE(), 0)')->execute([$ipHash]);
        $limit = $pdo->prepare('SELECT uploads FROM upload_limits WHERE ip_hash = ? AND upload_date = CURDATE() FOR UPDATE');
        $limit->execute([$ipHash]);
        if ((int)$limit->fetchColumn() >= 12) { $pdo->rollBack(); response(['error' => 'Batas 12 unggahan per hari tercapai. Coba besok.'], 429); }

        if (!move_uploaded_file($file['tmp_name'], $target)) throw new RuntimeException('File tidak berhasil disimpan.');
        @chmod($target, 0644);
        $pdo->prepare('INSERT INTO village_photos (village_id, filename, caption) VALUES (?, ?, ?)')->execute([$villageId, $filename, $caption]);
        $pdo->prepare('UPDATE upload_limits SET uploads = uploads + 1 WHERE ip_hash = ? AND upload_date = CURDATE()')->execute([$ipHash]);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        if (is_file($target)) @unlink($target);
        throw $e;
    }
    response(['ok' => true, 'villages' => villages_payload()]);
} catch (Throwable $e) { public_api_error($e); }
