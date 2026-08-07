<?php

declare(strict_types=1);

/*
 |--------------------------------------------------------------------------
 | ERROR DISPLAY (standard appstarter production boot)
 |--------------------------------------------------------------------------
 | Don't show ANY in production environments. Instead, let Composer or
 | whatever tooling you use handle pre-production testing.
 */
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_STRICT & ~E_USER_NOTICE & ~E_USER_DEPRECATED);

/*
 |--------------------------------------------------------------------------
 | SQLite WAL mode (roadmap 2.7)
 |--------------------------------------------------------------------------
 | WAL (Write-Ahead Logging) gives far better read/write concurrency than
 | the default rollback journal — readers never block the writer — and
 | synchronous=NORMAL is the safe companion pragma for WAL.
 |
 | `journal_mode` is persistent: once a database file is switched to WAL it
 | stays in WAL, so running this on every production boot is idempotent.
 | For development either copy this block into app/Config/Boot/development.php
 | or simply hit the site once in production mode.
 |
 | Wrapped in try/catch: boot files run very early and a broken/missing
 | database file must never white-screen the whole site.
 */
try {
    $db = \Config\Database::connect();
    $db->query('PRAGMA journal_mode = WAL;');
    $db->query('PRAGMA synchronous = NORMAL;');
} catch (\Throwable $exception) {
    log_message('error', '[ci4-cms] Failed to set SQLite WAL pragmas: {message}', [
        'message' => $exception->getMessage(),
    ]);
}
