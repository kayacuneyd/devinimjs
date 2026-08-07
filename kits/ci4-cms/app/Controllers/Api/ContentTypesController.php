<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Libraries\Fields\FieldFactory;
use App\Models\ContentTypeModel;
use App\Models\FieldModel;
use CodeIgniter\HTTP\ResponseInterface;
use Config\Services;

/**
 * /api/content-types — CRUD over content_types + fields (roadmap 2.3).
 *
 * show() embeds the type's fields ordered by sort_order. create()/update()
 * accept a `fields` array; each entry is { name, label?, field_type,
 * config?, sort_order? } where `config` is a JSON object (roadmap 2.3:
 * {options: [...], required: true, default: ...}). field_type is checked
 * against the FieldFactory registry so only renderable types persist.
 *
 * Update strategy for `fields`: full replace — existing rows for the type
 * are deleted and the posted set is inserted. Simple and predictable for
 * an admin form that always submits the whole field list.
 */
class ContentTypesController extends BaseApiController
{
    protected ContentTypeModel $typeModel;

    protected FieldModel $fieldModel;

    public function __construct()
    {
        $this->typeModel  = new ContentTypeModel();
        $this->fieldModel = new FieldModel();
    }

    /**
     * GET / — all content types with their field counts.
     */
    public function index(): ResponseInterface
    {
        if (! $this->guardRead()) {
            return $this->response;
        }

        $rows = $this->typeModel
            ->select('content_types.*, COUNT(fields.id) AS field_count')
            ->join('fields', 'fields.type_id = content_types.id', 'left')
            ->groupBy('content_types.id')
            ->orderBy('content_types.id', 'ASC')
            ->findAll();

        return $this->ok($rows);
    }

    /**
     * GET /{id} — type row plus its fields (ordered by sort_order).
     *
     * @param int|string|null $id
     */
    public function show($id = null): ResponseInterface
    {
        if (! $this->guardRead()) {
            return $this->response;
        }

        $type = is_numeric($id) ? $this->typeModel->find((int) $id) : null;
        if ($type === null) {
            return $this->failNotFound('Content type not found: ' . $id);
        }

        $type['fields'] = $this->fieldModel->forType((int) $type['id']);

        return $this->ok($type);
    }

    /**
     * POST / — JSON { name, slug?, description?, icon?, fields? }.
     */
    public function create(): ResponseInterface
    {
        if (! $this->guardWrite()) {
            return $this->response;
        }

        $input = (array) $this->request->getJSON(true);
        if (! $this->validateType($input)) {
            return $this->failValidationErrors(Services::validation()->getErrors());
        }
        if (($error = $this->validateFields($input['fields'] ?? [])) !== null) {
            return $this->failValidationErrors(['fields' => $error]);
        }

        $slug = trim((string) ($input['slug'] ?? ''));
        if ($slug === '') {
            $slug = url_title((string) $input['name'], '-', true);
        }

        $db = db_connect();
        $db->transStart();

        $typeId = $this->typeModel->insert([
            'name'        => trim((string) $input['name']),
            'slug'        => $slug,
            'description' => $input['description'] ?? null,
            'icon'        => $input['icon'] ?? null,
        ], true);

        if ($typeId !== false) {
            $this->insertFields((int) $typeId, (array) ($input['fields'] ?? []));
        }

        $db->transComplete();

        if ($typeId === false || $db->transStatus() === false) {
            return $this->fail('Could not create the content type.', 500);
        }

        return $this->show($typeId);
    }

    /**
     * PUT/PATCH /{id} — JSON { name?, slug?, description?, icon?, fields? }.
     * When `fields` is present the type's whole field set is replaced.
     *
     * @param int|string|null $id
     */
    public function update($id = null): ResponseInterface
    {
        if (! $this->guardWrite()) {
            return $this->response;
        }

        $existing = is_numeric($id) ? $this->typeModel->find((int) $id) : null;
        if ($existing === null) {
            return $this->failNotFound('Content type not found: ' . $id);
        }

        $input = (array) $this->request->getJSON(true);
        if (! $this->validateType($input, (int) $existing['id'])) {
            return $this->failValidationErrors(Services::validation()->getErrors());
        }
        if (array_key_exists('fields', $input)
            && ($error = $this->validateFields((array) $input['fields'])) !== null) {
            return $this->failValidationErrors(['fields' => $error]);
        }

        $row = [];
        foreach (['name', 'slug', 'description', 'icon'] as $key) {
            if (array_key_exists($key, $input)) {
                $row[$key] = is_string($input[$key]) ? trim($input[$key]) : $input[$key];
            }
        }

        $db = db_connect();
        $db->transStart();

        if ($row !== [] && ! $this->typeModel->update((int) $existing['id'], $row)) {
            $db->transRollback();

            return $this->failValidationErrors($this->typeModel->errors());
        }

        if (array_key_exists('fields', $input)) {
            $this->fieldModel->where('type_id', (int) $existing['id'])->delete();
            $this->insertFields((int) $existing['id'], (array) $input['fields']);
        }

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->fail('Could not update the content type.', 500);
        }

        return $this->show((int) $existing['id']);
    }

    /**
     * DELETE /{id} — deletes the type, its fields and its contents in one
     * transaction. (SQLite ships with foreign-key enforcement off, so the
     * cascade is done explicitly here instead of relying on ON DELETE.)
     *
     * @param int|string|null $id
     */
    public function delete($id = null): ResponseInterface
    {
        if (! $this->guardWrite()) {
            return $this->response;
        }

        $existing = is_numeric($id) ? $this->typeModel->find((int) $id) : null;
        if ($existing === null) {
            return $this->failNotFound('Content type not found: ' . $id);
        }

        $db = db_connect();
        $db->transStart();
        $db->table('fields')->where('type_id', (int) $existing['id'])->delete();
        $db->table('contents')->where('type_id', (int) $existing['id'])->delete();
        $this->typeModel->delete((int) $existing['id']);
        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->fail('Could not delete the content type.', 500);
        }

        return $this->ok(['id' => (int) $existing['id'], 'deleted' => true]);
    }


    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    /** Validate the content_types columns of a create/update payload. */
    protected function validateType(array $input, ?int $ignoreId = null): bool
    {
        $uniqueSlug = 'is_unique[content_types.slug' . ($ignoreId !== null ? ',id,' . $ignoreId : '') . ']';

        $rules = [
            'name'        => ($ignoreId === null ? 'required|' : 'permit_empty|') . 'min_length[2]|max_length[100]',
            'slug'        => 'permit_empty|max_length[100]|alpha_dash|' . $uniqueSlug,
            'description' => 'permit_empty|max_length[500]',
            'icon'        => 'permit_empty|max_length[50]',
            // No stock 'is_array' rule — validateFields() checks each entry.
            'fields'      => 'permit_empty',
        ];

        return Services::validation()->setRules($rules)->run($input);
    }

    /**
     * Validate the embedded field definitions. Returns an error message
     * string, or null when everything is acceptable.
     */
    protected function validateFields(array $fields): ?string
    {
        foreach ($fields as $index => $field) {
            if (! is_array($field)) {
                return 'Field #' . ($index + 1) . ' must be an object.';
            }
            $name = trim((string) ($field['name'] ?? ''));
            if ($name === '' || ! preg_match('/^[a-z][a-z0-9_]*$/', $name)) {
                return 'Field #' . ($index + 1) . ' needs a snake_case name.';
            }
            $type = (string) ($field['field_type'] ?? '');
            if (! FieldFactory::isSupported($type)) {
                return 'Field "' . $name . '" has unknown type "' . $type . '". Supported: '
                    . implode(', ', FieldFactory::supported()) . '.';
            }
            if (isset($field['config']) && ! is_array($field['config'])) {
                return 'Field "' . $name . '" config must be an object.';
            }
        }

        return null;
    }

    /**
     * Insert the posted field definitions for a content type.
     *
     * @param list<array<string, mixed>> $fields
     */
    protected function insertFields(int $typeId, array $fields): void
    {
        $sort = 0;
        foreach ($fields as $field) {
            $this->fieldModel->insert([
                'type_id'    => $typeId,
                'name'       => trim((string) $field['name']),
                'label'      => (string) ($field['label'] ?? $field['name']),
                'field_type' => (string) $field['field_type'],
                'config'     => isset($field['config']) && is_array($field['config']) ? $field['config'] : [],
                'sort_order' => isset($field['sort_order']) ? (int) $field['sort_order'] : $sort,
            ]);
            $sort++;
        }
    }
}

