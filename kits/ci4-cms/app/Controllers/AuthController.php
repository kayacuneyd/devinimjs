<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\RedirectResponse;
use CodeIgniter\HTTP\ResponseInterface;
use Config\Services;

/**
 * Session authentication (roadmap 2.2 / ADR-004).
 *
 * Shield is deliberately not used — a plain CI4 session keeps the kit
 * deployable on the cheapest shared hosting.
 *
 *   GET  /login       → renders app/Views/auth/login.php (standalone page)
 *   POST /auth/login  → JSON in, JSON out (consumed by the login page's fetch)
 *   GET  /logout      → destroys the session, redirects to /login
 *   POST /auth/logout → destroys the session, responds JSON (for the SPA)
 *
 * The login POST expects the `X-CSRF-TOKEN` header to match csrf_hash();
 * the login view renders the token into a <meta> tag and sends it along.
 */
class AuthController extends BaseController
{
    use ResponseTrait;

    protected UserModel $userModel;

    public function __construct()
    {
        $this->userModel = new UserModel();
    }

    /**
     * GET /login — standalone login screen.
     */
    public function loginForm(): string|RedirectResponse
    {
        if (session()->get('user_id')) {
            return redirect()->to('/admin');
        }

        return view('auth/login', [
            'csrfToken' => csrf_hash(),
        ]);
    }

    /**
     * POST /auth/login — JSON {email, password} → JSON {success, user}.
     */
    public function login(): ResponseInterface
    {
        // The login page sends the token from its <meta name="csrf-token"> tag.
        $token = (string) $this->request->getHeaderLine('X-CSRF-TOKEN');
        if ($token === '' || ! hash_equals(csrf_hash(), $token)) {
            return $this->fail('Invalid or missing CSRF token.', 403);
        }

        $rules = [
            'email'    => 'required|valid_email',
            'password' => 'required|min_length[6]',
        ];

        $data = (array) ($this->request->getJSON(true) ?? $this->request->getPost());

        $validation = Services::validation();
        if (! $validation->setRules($rules)->run($data)) {
            return $this->failValidationErrors($validation->getErrors());
        }

        /** @var array<string, mixed>|null $user */
        $user = $this->userModel->where('email', (string) $data['email'])->first();

        if ($user === null || ! password_verify((string) $data['password'], (string) $user['password'])) {
            return $this->failUnauthorized('Invalid credentials');
        }

        // Defend against session fixation before elevating privileges.
        session()->regenerate(true);
        session()->set([
            'user_id'    => $user['id'],
            'user_email' => $user['email'],
        ]);

        return $this->respond([
            'success' => true,
            'user'    => [
                'name'  => $user['name'],
                'email' => $user['email'],
            ],
        ]);
    }

    /**
     * GET /logout (browser) or POST /auth/logout (SPA fetch).
     */
    public function logout(): ResponseInterface|RedirectResponse
    {
        session()->destroy();

        if ($this->request->isAJAX() || $this->request->getMethod(true) === 'POST') {
            return $this->respond(['success' => true]);
        }

        return redirect()->to('/login');
    }
}
