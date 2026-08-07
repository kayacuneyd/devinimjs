<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

/**
 * media table (roadmap 2.6) — one row per uploaded file.
 *
 * created_at is filled by the database default (CURRENT_TIMESTAMP), so the
 * model does not manage timestamps.
 */
class MediaModel extends Model
{
    protected $table         = 'media';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $allowedFields = ['filename', 'original_name', 'mime', 'size', 'path', 'thumb_path'];
    protected $useTimestamps = false;

    /** @var array<string, string> */
    protected $casts = [
        'id'   => 'int',
        'size' => 'int',
    ];
}
