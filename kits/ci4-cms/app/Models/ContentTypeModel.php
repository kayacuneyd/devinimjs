<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

/**
 * content_types table (roadmap 2.3) — Blog Post, Page, Product, ...
 *
 * created_at is filled by the database default (CURRENT_TIMESTAMP, see the
 * migration), so timestamps are intentionally not managed by the model.
 */
class ContentTypeModel extends Model
{
    protected $table         = 'content_types';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $allowedFields = ['name', 'slug', 'description', 'icon'];
    protected $useTimestamps = false;

    /**
     * Find a content type by its URL/machine slug ('post', 'page', ...).
     *
     * @return array<string, mixed>|null
     */
    public function findBySlug(string $slug): ?array
    {
        /** @var array<string, mixed>|null */
        return $this->where('slug', $slug)->first();
    }
}
