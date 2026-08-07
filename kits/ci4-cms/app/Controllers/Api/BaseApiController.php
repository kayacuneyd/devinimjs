<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use Psr\Log\LoggerInterface;

/**
 * Base class for every /api controller (roadmap 2.1).
 *
 * Access policy (all three layers, defense in depth):
 *
 *   1. AJAX only — requests must carry `X-Requested-With: XMLHttpRequest`.
 *      DevinimJS createApi() sets this header automatically.
 *   2. Session auth — a logged-in session (user_id) is required. The
 *      `apiAuth` route filter already rejects guests with a 401 JSON body
 *      before the controller runs; requireAuth() repeats the check here so
 *      controllers stay safe even if a route is ever registered without
 *      the filter.
 *   3. CSRF — state-changing requests (POST/PUT/PATCH/DELETE) must send the
 *      session-bound token as the `X-CSRF-TOKEN` header. CI4's Security
 *      filter is NOT enabled for the api group (see app/Config/Filters.php),
 *      so verifyCsrfHeader() compares the header against csrf_hash()
 *      instead. DevinimJS createApi() sends the header automatically from
 *      the admin shell's <meta name="csrf-token"> tag.
 *
 * IMPORTANT CI4 NOTE: initController() cannot short-circuit a request with
 * an early response (its return value is ignored). Guard helpers therefore
 * set $this->response and return bool — callers use:
 *
 *     if (! $this->guardRead())  { return $this->response; }
 *     if (! $this->guardWrite()) { return $this->response; }
 */
abstract class BaseApiController extends ResourceController
{
    /**
     * Default (and only) response format for the kit's API.
     *
     * @var string
     */
    protected $format = 'json';

    /**
     * @return void
     */
    public function initController(RequestInterface $request, ResponseInterface $response, LoggerInterface $logger)
    {
        parent::initController($request, $response, $logger);

        // See the class docblock: guards live in require*() helpers because
        // returning a response from here would have no effect in CI4.
    }

    // ------------------------------------------------------------------
    // Guards — each sets $this->response and returns false on rejection
    // ------------------------------------------------------------------

    /**
     * Allow AJAX requests only (roadmap 2.1).
     */
    protected function requireAjax(): bool
    {
        if ($this->request->isAJAX()) {
            return true;
        }

        $this->response->setStatusCode(403)->setJSON([
            'error' => 'AJAX requests only',
        ]);

        return false;
    }

    /**
     * Require an authenticated session (roadmap 2.1/2.10).
     */
    protected function requireAuth(): bool
    {
        if (session()->get('user_id')) {
            return true;
        }

        $this->response->setStatusCode(401)->setJSON([
            'error'     => 'Login required',
            'login_url' => '/login',
        ]);

        return false;
    }

    /**
     * Verify the X-CSRF-TOKEN header against the session-bound csrf_hash().
     *
     * Pure comparison — use requireCsrf() in actions. Used instead of CI4's
     * Security filter because that filter is form/redirect oriented; the API
     * needs a JSON 403 and no token regeneration on every request (the SPA
     * reads the token once from the shell's <meta> tag).
     */
    protected function verifyCsrfHeader(): bool
    {
        $token = (string) $this->request->getHeaderLine('X-CSRF-TOKEN');

        return $token !== '' && hash_equals(csrf_hash(), $token);
    }

    /**
     * Require a valid CSRF header (sets a JSON 403 on failure).
     */
    protected function requireCsrf(): bool
    {
        if ($this->verifyCsrfHeader()) {
            return true;
        }

        $this->response->setStatusCode(403)->setJSON([
            'error' => 'Invalid or missing CSRF token',
        ]);

        return false;
    }

    /**
     * One-call guard for read endpoints: AJAX + session.
     */
    protected function guardRead(): bool
    {
        return $this->requireAjax() && $this->requireAuth();
    }

    /**
     * One-call guard for write endpoints: AJAX + session + CSRF header.
     */
    protected function guardWrite(): bool
    {
        return $this->requireAjax() && $this->requireAuth() && $this->requireCsrf();
    }

    // ------------------------------------------------------------------
    // Response conveniences
    // ------------------------------------------------------------------

    /**
     * Success envelope: { data: ..., meta?: {...} }.
     *
     * @param mixed $data
     * @param array<string, mixed> $meta
     */
    protected function ok($data = null, array $meta = [], int $status = 200): ResponseInterface
    {
        $body = ['data' => $data];
        if ($meta !== []) {
            $body['meta'] = $meta;
        }

        return $this->respond($body, $status);
    }

    /**
     * Error envelope: { error: ..., errors?: {...} }.
     *
     * Signature-compatible extension of ResponseTrait::fail() (same first
     * four params, wider visibility) adding an optional field-error map —
     * the kit's error shape stays identical no matter how the CI4 version
     * formats the stock trait responses.
     *
     * @param string|array<string, string>|list<string> $messages
     */
    public function fail($messages, int $status = 400, ?string $code = null, string $customMessage = '', array $errors = []): ResponseInterface
    {
        $body = ['error' => $customMessage !== '' ? $customMessage : $messages];
        if ($errors !== []) {
            $body['errors'] = $errors;
        }

        return $this->respond($body, $status);
    }

    /**
     * Validation failures always surface as
     * { error: "Validation failed", errors: { field: message } } — exactly
     * the shape DevinimJS createApi consumers read via error.body.errors.
     *
     * @param array<string, string>|string $errors
     */
    public function failValidationErrors($errors, ?string $code = null, string $customMessage = ''): ResponseInterface
    {
        return $this->fail(
            'Validation failed',
            400,
            $code,
            $customMessage,
            is_array($errors) ? $errors : ['error' => (string) $errors],
        );
    }
}
