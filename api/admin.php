<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require_admin();
try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') response(['villages' => villages_payload()]);
    require_method('POST'); verify_csrf();
    $action = (string) ($_POST['action'] ?? '');
    $villageId = (string) ($_POST['village_id'] ?? '');
    if ($action === 'description') {
        if (!village_exists($villageId)) response(['error' => 'Desa tidak ditemukan.'], 404);
        $description = clean((string) ($_POST['description'] ?? ''), 600);
        $s = db()->prepare('UPDATE villages SET description = ? WHERE id = ?');
        $s->execute([$description, $villageId]);
    } elseif ($action === 'coordinates') {
        if (!village_exists($villageId)) response(['error' => 'Desa tidak ditemukan.'], 404);
        $lat = filter_var($_POST['lat'] ?? null, FILTER_VALIDATE_FLOAT);
        $lng = filter_var($_POST['lng'] ?? null, FILTER_VALIDATE_FLOAT);
        if ($lat === false || $lng === false || $lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) response(['error' => 'Koordinat harus angka lintang/bujur yang valid.'], 422);
        $s = db()->prepare('UPDATE villages SET lat = ?, lng = ? WHERE id = ?'); $s->execute([$lat, $lng, $villageId]);
    } elseif ($action === 'caption') {
        $id = filter_var($_POST['photo_id'] ?? null, FILTER_VALIDATE_INT);
        if (!$id) response(['error' => 'ID foto tidak valid.'], 422);
        $caption = clean((string) ($_POST['caption'] ?? ''), 180);
        $s = db()->prepare('UPDATE village_photos SET caption = ? WHERE id = ?');
        $s->execute([$caption, $id]);
        if (!$s->rowCount()) { $c = db()->prepare('SELECT 1 FROM village_photos WHERE id = ?'); $c->execute([$id]); if (!$c->fetchColumn()) response(['error'=>'Foto tidak ditemukan.'],404); }
    } elseif ($action === 'delete_photo') {
        $id = filter_var($_POST['photo_id'] ?? null, FILTER_VALIDATE_INT);
        if (!$id) response(['error' => 'ID foto tidak valid.'], 422);
        $s = db()->prepare('SELECT filename FROM village_photos WHERE id = ?'); $s->execute([$id]); $row = $s->fetch();
        if (!$row) response(['error' => 'Foto tidak ditemukan.'], 404);
        $d = db()->prepare('DELETE FROM village_photos WHERE id = ?'); $d->execute([$id]);
        $target = dirname(__DIR__) . '/uploads/desa/' . basename($row['filename']);
        if (is_file($target)) @unlink($target);
    } else response(['error' => 'Aksi tidak dikenal.'], 422);
    response(['ok' => true, 'villages' => villages_payload()]);
} catch (Throwable $e) { public_api_error($e); }
