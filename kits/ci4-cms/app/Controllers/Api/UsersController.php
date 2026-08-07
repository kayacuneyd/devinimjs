<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Models\UserModel;
use CodeIgniter\HTTP\ResponseInterface;
use Config\Services;

/**
 * /api/users — minimal admin user CRUD (roadmap 2.2/2.4).
 *
 * Passwords are hashed by UserModel's beforeInsert/beforeUpdate callbacks
 * (password_hash, PASSWORD_DEFAULT) — see the model for that decision.
 * Password hashes NEVER leave the server: every response passes through
 * sanitize(), and `password` is not part of any list/show payload.
 */
class UsersController extends BaseApiController
{
    protected UserModel $userModel;

    public function __construct()
    {
        $this->userModel = new UserModel();
    }

    /**
     * GET / — paginated list. Query: page, limit, q (name/email LIKE).
     */
    public function index(): ResponseInterface
    {
        if (! $this->guardRead()) {
            return $this->response;
        }

        $page  = max(1, (int) ($this->request->getGet('page') ?? 1));
        $limit = (int) ($this->request->getGet('limit') ?? 20);
        $limit = $limit < 1 ? 20 : min(100, $limit);

        $query = $this->userModel;
        $term  = trim((string) ($this->request->getGet('q') ?? ''));
        if ($term !== '') {
            $query = $query->groupStart()
                ->like('name', $term)
                ->orLike('email', $term)
                ->groupEnd();
        }

        $total = $query->countAllResults(false);
        $rows  = $query->orderBy('id', 'ASC')->findAll($limit, ($page - 1) * $limit);

        return $this->ok(array_map($this->sanitize(...), $rows), [
            'page' => $page, 'limit' => $limit, 'total' => $total,
        ]);
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

        $row = is_numeric($id) ? $this->userModel->find((int) $id) : null;

        return $row === null
            ? $this->failNotFound('User not found: ' . $id)
            : $this->ok($this->sanitize($row));
    }

    /**
     * POST / — JSON { name, email, password }.
     */
    public function create(): ResponseInterface
    {
        if (! $this->guardWrite()) {
            return $this->response;
        }

        $input = (array) $this->request->getJSON(true);
        $rules = [
            'name'     => 'required|min_length[2]|max_length[100]',
            'email'    => 'required|valid_email|max_length[255]|is_unique[users.email]',
            'password' => 'required|min_length[6]|max_length[255]',
        ];

        if (! Services::validation()->setRules($rules)->run($input)) {
            return $this->failValidationErrors(Services::validation()->getErrors());
        }

        $id = $this->userModel->insert([
            'name'     => trim((string) $input['name']),
            'email'    => trim((string) $input['email']),
            'password' => (string) $input['password'], // hashed by the model callback
        ], true);

        if ($id === false) {
            return $this->failValidationErrors($this->userModel->errors());
        }

        return $this->ok($this->sanitize($this->userModel->find($id)), [], 201);
    }

    /**
     * PUT/PATCH /{id} — JSON { name?, email?, password? }. An empty/absent
     * password leaves the current hash untouched.
     *
     * @param int|string|null $id
     */
    public function update($id = null): ResponseInterface
    {
        if (! $this->guardWrite()) {
            return $this->response;
        }

        $existing = is_numeric($id) ? $this->userModel->find((int) $id) : null;
        if ($existing === null) {
            return $this->failNotFound('User not found: ' . $id);
        }

        $input = (array) $this->request->getJSON(true);
        $uid   = (int) $existing['id'];
        $rules = [
            'name'     => 'permit_empty|min_length[2]|max_length[100]',
            'email'    => 'permit_empty|valid_email|max_length[255]|is_unique[users.email,id,' . $uid . ']',
            'password' => 'permit_empty|min_length[6]|max_length[255]',
        ];

        if (! Services::validation()->setRules($rules)->run($input)) {
            return $this->failValidationErrors(Services::validation()->getErrors());
        }

        $row = [];
        foreach (['name', 'email'] as $key) {
            if (isset($input[$key]) && is_string($input[$key]) && trim($input[$key]) !== '') {
                $row[$key] = trim($input[$key]);
            }
        }
        if (isset($input['password']) && is_string($input['password']) && $input['password'] !== '') {
            $row['password'] = $input['password']; // hashed by the model callback
        }

        if ($row !== [] && ! $this->userModel->update($uid, $row)) {
            return $this->failValidationErrors($this->userModel->errors());
        }

        return $this->ok($this->sanitize($this->userModel->find($uid)));
    }


    /**
     * DELETE /{id} — refuses to delete the last remaining account or
     * yourself (both would lock the admin panel).
     *
     * @param int|string|null $id
     */
    public function delete($id = null): ResponseInterface
    {
        if (! $this->guardWrite()) {
            return $this->response;
        }

        $existing = is_numeric($id) ? $this->userModel->find((int) $id) : null;
        if ($existing === null) {
            return $this->failNotFound('User not found: ' . $id);
        }

        if ((int) $existing['id'] === (int) session()->get('user_id')) {
            return $this->fail('You cannot delete the account you are logged in with.', 422);
        }
        if ($this->userModel->countAllResults() <= 1) {
            return $this->fail('You cannot delete the last user account.', 422);
        }

        $this->userModel->delete((int) $existing['id']);

        return $this->ok(['id' => (int) $existing['id'], 'deleted' => true]);
    }

    /**
     * Strip the password hash (and anything sensitive added later) from a
     * user row before it goes out over the wire.
     *
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function sanitize(array $row): array
    {
        unset($row['password']);

        return $row;
    }
}

