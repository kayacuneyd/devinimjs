<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Libraries\Hook;
use App\Models\ContentModel;
use App\Models\ContentTypeModel;
use CodeIgniter\HTTP\ResponseInterface;
use Config\Services;

/**
 * Shared CRUD for row-per-record content types backed by the `contents`
 * table (roadmap 2.3/2.4). PostsController and PagesController are thin
 * subclasses that only declare their type slug — keep this DRY here.
 *
 * Response envelopes:
 *   index/search → { data: [...], meta: { page, limit, total } }
 *   show/create/update/publish/duplicate → { data: {...} }
 *   errors → ResponseTrait fail* envelopes ({ error, messages })
 */
abstract class ApiContentController extends BaseApiController
{
    protected ContentModel $contentModel;

    protected ContentTypeModel $typeModel;

    /**
     * The content_types.slug this controller manages ('post', 'page', ...).
     */
    abstract protected function typeSlug(): string;

    public function __construct()
    {
        $this->contentModel = new ContentModel();
        $this->typeModel    = new ContentTypeModel();
    }

    /**
     * GET / — paginated list.
     *
     * Query params: page (1-based), limit (1..100, default 20), q (title
     * LIKE), status (draft|published|archived). Ordered published_at DESC
     * (unpublished drafts last) with id DESC as tie-breaker.
     */
    public function index(): ResponseInterface
    {
        if (! $this->guardRead()) {
            return $this->response;
        }

        $typeId = $this->typeId();
        if ($typeId === null) {
            return $this->failNotFound('Unknown content type: ' . $this->typeSlug());
        }

        [$page, $limit] = $this->pagination();
        $query = $this->filteredQuery($typeId);
        $total = $query->countAllResults(false);
        $rows  = $query->orderBy('published_at', 'DESC')
            ->orderBy('id', 'DESC')
            ->findAll($limit, ($page - 1) * $limit);

        return $this->ok($rows, ['page' => $page, 'limit' => $limit, 'total' => $total]);
    }

    /**
     * GET /{id}
     *
     * @param int|string|null $id
     */
    public function show($id = null): ResponseInterface
    {
        if (! $this->guardRead()) {
            return $this->response;
        }

        $row = $this->findOwned($id);

        return $row === null
            ? $this->failNotFound('Content not found: ' . $id)
            : $this->ok($row);
    }

    /**
     * POST / — JSON body: title, slug?, status?, data? (object of dynamic
     * field values), published_at?. Slug is auto-generated from the title
     * via url_title() when absent, then made unique.
     */
    public function create(): ResponseInterface
    {
        if (! $this->guardWrite()) {
            return $this->response;
        }

        $typeId = $this->typeId();
        if ($typeId === null) {
            return $this->failNotFound('Unknown content type: ' . $this->typeSlug());
        }

        $input = (array) $this->request->getJSON(true);
        if (! $this->validateContent($input)) {
            return $this->failValidationErrors(Services::validation()->getErrors());
        }

        $row = [
            'type_id'   => $typeId,
            'title'     => trim((string) $input['title']),
            'slug'      => trim((string) ($input['slug'] ?? '')),
            'status'    => (string) ($input['status'] ?? 'draft'),
            'author_id' => (int) session()->get('user_id'),
            'data'      => isset($input['data']) && is_array($input['data']) ? $input['data'] : [],
        ];

        // Plugin hook (roadmap 2.5): listeners may rewrite any column,
        // e.g. derive the slug from the title.
        /** @var array<string, mixed> $row */
        $row = Hook::trigger('content.before_save', $row);

        if (! is_string($row['slug']) || trim($row['slug']) === '') {
            $row['slug'] = url_title((string) $row['title'], '-', true);
        }
        $row['slug'] = $this->uniqueSlug((string) $row['slug']);

        if ($row['status'] === 'published') {
            $row['published_at'] = date('Y-m-d H:i:s');
        }

        $id = $this->contentModel->insert($row, true);
        if ($id === false) {
            return $this->failValidationErrors($this->contentModel->errors());
        }

        return $this->ok($this->contentModel->find($id), [], 201);
    }

    /**
     * PUT/PATCH /{id} — same body as create(); omitted keys keep their
     * current values.
     *
     * @param int|string|null $id
     */
    public function update($id = null): ResponseInterface
    {
        if (! $this->guardWrite()) {
            return $this->response;
        }

        $existing = $this->findOwned($id);
        if ($existing === null) {
            return $this->failNotFound('Content not found: ' . $id);
        }

        $input = (array) $this->request->getJSON(true);
        if (! $this->validateContent($input, (int) $existing['id'])) {
            return $this->failValidationErrors(Services::validation()->getErrors());
        }

        $row = array_intersect_key($input, array_flip(['title', 'slug', 'status', 'data', 'published_at']));
        if (isset($row['title'])) {
            $row['title'] = trim((string) $row['title']);
        }
        if (isset($row['slug'])) {
            $row['slug'] = trim((string) $row['slug']);
            if ($row['slug'] === '' && isset($row['title'])) {
                $row['slug'] = url_title((string) $row['title'], '-', true);
            }
        }
        if (isset($row['data']) && ! is_array($row['data'])) {
            $row['data'] = [];
        }

        // Never move a record between content types via the API.
        $row['type_id'] = (int) $existing['type_id'];

        /** @var array<string, mixed> $row */
        $row = Hook::trigger('content.before_save', $row + ['id' => (int) $existing['id']]);
        unset($row['id']);

        if (isset($row['slug'])) {
            $row['slug'] = $this->uniqueSlug((string) $row['slug'], (int) $existing['id']);
        }
        if (($row['status'] ?? null) === 'published' && empty($existing['published_at'])) {
            $row['published_at'] = date('Y-m-d H:i:s');
        }

        if ($row !== [] && ! $this->contentModel->update((int) $existing['id'], $row)) {
            return $this->failValidationErrors($this->contentModel->errors());
        }

        return $this->ok($this->contentModel->find((int) $existing['id']));
    }

    /**
     * DELETE /{id}
     *
     * @param int|string|null $id
     */
    public function delete($id = null): ResponseInterface
    {
        if (! $this->guardWrite()) {
            return $this->response;
        }

        $existing = $this->findOwned($id);
        if ($existing === null) {
            return $this->failNotFound('Content not found: ' . $id);
        }

        $this->contentModel->delete((int) $existing['id']);

        return $this->ok(['id' => (int) $existing['id'], 'deleted' => true]);
    }

    /**
     * POST /{id}/publish — set status=published and stamp published_at
     * (first publish only; re-publishing keeps the original date).
     *
     * @param int|string|null $id
     */
    public function publish($id = null): ResponseInterface
    {
        if (! $this->guardWrite()) {
            return $this->response;
        }

        $existing = $this->findOwned($id);
        if ($existing === null) {
            return $this->failNotFound('Content not found: ' . $id);
        }

        $row = ['status' => 'published'];
        if (empty($existing['published_at'])) {
            $row['published_at'] = date('Y-m-d H:i:s');
        }
        $this->contentModel->update((int) $existing['id'], $row);

        return $this->ok($this->contentModel->find((int) $existing['id']));
    }

    /**
     * POST /{id}/duplicate — copy as a new draft with a fresh unique slug.
     *
     * @param int|string|null $id
     */
    public function duplicate($id = null): ResponseInterface
    {
        if (! $this->guardWrite()) {
            return $this->response;
        }

        $existing = $this->findOwned($id);
        if ($existing === null) {
            return $this->failNotFound('Content not found: ' . $id);
        }

        $copy = [
            'type_id'      => (int) $existing['type_id'],
            'title'        => $existing['title'] . ' (kopya)',
            'slug'         => $this->uniqueSlug((string) $existing['slug'] . '-kopya'),
            'status'       => 'draft',
            'author_id'    => (int) session()->get('user_id'),
            'data'         => is_array($existing['data']) ? $existing['data'] : [],
            'published_at' => null,
        ];

        $newId = $this->contentModel->insert($copy, true);
        if ($newId === false) {
            return $this->failValidationErrors($this->contentModel->errors());
        }

        return $this->ok($this->contentModel->find($newId), [], 201);
    }


    /**
     * GET /search?q=...&page=&limit= — title/slug LIKE search inside this
     * controller's content type. Declared before the resource routes in
     * app/Config/Routes.php so it wins over show/(:segment).
     */
    public function search(): ResponseInterface
    {
        if (! $this->guardRead()) {
            return $this->response;
        }

        $typeId = $this->typeId();
        if ($typeId === null) {
            return $this->failNotFound('Unknown content type: ' . $this->typeSlug());
        }

        $term = trim((string) ($this->request->getGet('q') ?? ''));
        if ($term === '') {
            return $this->failValidationErrors(['q' => 'The q query parameter is required.']);
        }

        [$page, $limit] = $this->pagination();

        $query = $this->contentModel
            ->where('type_id', $typeId)
            ->groupStart()
            ->like('title', $term)
            ->orLike('slug', $term)
            ->groupEnd();

        $total = $query->countAllResults(false);
        $rows  = $query->orderBy('published_at', 'DESC')
            ->orderBy('id', 'DESC')
            ->findAll($limit, ($page - 1) * $limit);

        return $this->ok($rows, ['page' => $page, 'limit' => $limit, 'total' => $total, 'q' => $term]);
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    /** Cached content_types.id for this controller's slug. */
    protected function typeId(): ?int
    {
        static $cache = [];
        $slug = $this->typeSlug();

        if (! array_key_exists($slug, $cache)) {
            $type         = $this->typeModel->findBySlug($slug);
            $cache[$slug] = $type === null ? null : (int) $type['id'];
        }

        return $cache[$slug];
    }

    /** Find a row only if it belongs to this controller's content type. */
    protected function findOwned(mixed $id): ?array
    {
        if (! is_numeric($id)) {
            return null;
        }

        $typeId = $this->typeId();
        if ($typeId === null) {
            return null;
        }

        /** @var array<string, mixed>|null $row */
        $row = $this->contentModel
            ->where('type_id', $typeId)
            ->find((int) $id);

        return $row;
    }

    /** Validation for create/update payloads. */
    protected function validateContent(array $input, ?int $ignoreId = null): bool
    {
        $uniqueSlug = 'is_unique[contents.slug' . ($ignoreId !== null ? ',id,' . $ignoreId : '') . ']';

        $rules = [
            'title'  => ($ignoreId === null ? 'required|' : 'permit_empty|')
                . 'min_length[2]|max_length[255]',
            'slug'   => 'permit_empty|max_length[255]|alpha_dash|' . $uniqueSlug,
            'status' => 'permit_empty|in_list[draft,published,archived]',
            // No stock 'is_array' rule in CI4 — non-array data is coerced
            // to [] by the create()/update() code paths instead.
            'data'   => 'permit_empty',
        ];

        return Services::validation()->setRules($rules)->run($input);
    }

    /** Append -2, -3, ... until the slug is unique inside contents. */
    protected function uniqueSlug(string $slug, ?int $ignoreId = null): string
    {
        $candidate = $slug === '' ? 'icerik' : $slug;
        $suffix    = 1;

        while ($this->slugTaken($candidate, $ignoreId)) {
            $suffix++;
            $candidate = $slug . '-' . $suffix;
        }

        return $candidate;
    }

    protected function slugTaken(string $slug, ?int $ignoreId): bool
    {
        $query = $this->contentModel->where('slug', $slug);
        if ($ignoreId !== null) {
            $query->where('id !=', $ignoreId);
        }

        return $query->countAllResults() > 0;
    }

    /** Model with the shared list filters applied (type, q, status). */
    protected function filteredQuery(int $typeId): ContentModel
    {
        $query = $this->contentModel->where('type_id', $typeId);

        $term = trim((string) ($this->request->getGet('q') ?? ''));
        if ($term !== '') {
            $query->like('title', $term);
        }

        $status = (string) ($this->request->getGet('status') ?? '');
        if (in_array($status, ['draft', 'published', 'archived'], true)) {
            $query->where('status', $status);
        }

        return $query;
    }

    /** @return array{0: int, 1: int} [page, limit] with sane bounds. */
    protected function pagination(): array
    {
        $page  = max(1, (int) ($this->request->getGet('page') ?? 1));
        $limit = (int) ($this->request->getGet('limit') ?? 20);
        $limit = $limit < 1 ? 20 : min(100, $limit);

        return [$page, $limit];
    }
}

