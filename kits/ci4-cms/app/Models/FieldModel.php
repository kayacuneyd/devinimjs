<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

/**
 * fields table (roadmap 2.3) — the dynamic field definitions of each
 * content type. `config` holds the JSON column
 * ({options: [...], required: true, default: ...}) and is cast to/from a
 * PHP array automatically via CI4's `json` data cast.
 *
 * NOTE: model-level $casts require CodeIgniter >= 4.4 — the version
 * `composer create-project codeigniter4/appstarter` installs today.
 */
class FieldModel extends Model
{
    protected $table         = 'fields';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $allowedFields = ['type_id', 'name', 'label', 'field_type', 'config', 'sort_order'];
    protected $useTimestamps = false;

    /** @var array<string, string> */
    protected $casts = [
        'id'         => 'int',
        'type_id'    => 'int',
        'sort_order' => 'int',
        'config'     => 'json',
    ];

    /**
     * All fields of a content type, in admin-form order.
     *
     * @return list<array<string, mixed>>
     */
    public function forType(int $typeId): array
    {
        /** @var list<array<string, mixed>> */
        return $this->where('type_id', $typeId)
            ->orderBy('sort_order', 'ASC')
            ->orderBy('id', 'ASC')
            ->findAll();
    }
}
