<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require_method('GET');
try { response(['villages' => villages_payload(), 'csrf_token' => csrf()]); }
catch (Throwable $e) { public_api_error($e); }
