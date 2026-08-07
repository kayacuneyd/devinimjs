<?php

declare(strict_types=1);

namespace App\Models;

use CodeIgniter\Model;

/**
 * contents table (roadmap 2.3 / ADR-005).
 *
 * Every content record is one row: fixed columns (title, slug, status,
 * author_id, timestamps) plus a JSON `data` column holding the dynamic
 * field values defined by its content type. The `json` cast (CI4 >= 4.4)
 * transparently converts between the TEXT column and PHP arrays.
 *
 * Timestamps: created_at/updated_at are auto-touched by CI4
 * ($useTimestamps); published_at is set manually on first publish
 * (ApiContentController::publish()).
 */
class ContentModel extends Model
{
    protected $table         = 'contents';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $allowedFields = ['type_id', 'title', 'slug', 'status', 'author_id', 'data', 'published_at'];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    /** @var array<string, string> */
    protected $casts = [
        'id'        => 'int',
        'type_id'   => 'int',
        'author_id' => '?int',
        'data'      => 'json',
    ];

    // Model-level validation mirrors the API layer (defense in depth);
    // controllers still run request validation for good error messages.
    protected $validationRules = [
        'title'  => 'required|min_length[2]|max_length[255]',
        'slug'   => 'required|max_length[255]',
        'status' => 'permit_empty|in_list[draft,published,archived]',
    ];

    /**
     * One published record by slug — the public detail page lookup
     * (roadmap 2.9).
     *
     * @return array<string, mixed>|null
     */
    public function getBySlug(string $slug): ?array
    {
        /** @var array<string, mixed>|null */
        return $this->where('slug', $slug)
            ->where('status', 'published')
            ->first();
    }

    /**
     * Published records of one content type, newest first (roadmap 2.3).
     *
     * @return list<array<string, mixed>>
     */
    public function getByType(string $typeSlug, int $limit = 10, int $offset = 0): array
    {
        /** @var list<array<string, mixed>> */
        return $this->select('contents.*')
            ->join('content_types', 'content_types.id = contents.type_id')
            ->where('content_types.slug', $typeSlug)
            ->where('contents.status', 'published')
            ->orderBy('contents.published_at', 'DESC')
            ->orderBy('contents.id', 'DESC')
            ->limit($limit, $offset)
            ->findAll();
    }

    /**
     * Number of published records of one content type (archive pagination).
     */
    public function countByType(string $typeSlug): int
    {
        return $this->join('content_types', 'content_types.id = contents.type_id')
            ->where('content_types.slug', $typeSlug)
            ->where('contents.status', 'published')
            ->countAllResults();
    }

    /**
     * Title/slug LIKE search across every published record — used by the
     * public site; the admin API has its own type-scoped search.
     *
     * @return list<array<string, mixed>>
     */
    public function search(string $term, int $limit = 20, int $offset = 0): array
    {
        /** @var list<array<string, mixed>> */
        return $this->groupStart()
            ->like('title', $term)
            ->orLike('slug', $term)
            ->groupEnd()
            ->where('status', 'published')
            ->orderBy('published_at', 'DESC')
            ->orderBy('id', 'DESC')
            ->findAll($limit, $offset);
    }
}
