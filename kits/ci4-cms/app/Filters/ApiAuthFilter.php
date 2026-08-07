<?php

declare(strict_types=1);

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Config\Services;

/**
 * Session guard for the /api route group (roadmap 2.10).
 *
 * Guests get a machine-readable 401 — { error, login_url } — which the
 * DevinimJS createApi() client surfaces through its onUnauthorized hook
 * (the admin SPA redirects to /login). Registered as the `apiAuth` alias
 * in app/Config/Filters.php and applied to the api group in Routes.php.
 */
class ApiAuthFilter implements FilterInterface
{
    /**
     * @param list<string>|null $arguments
     */
    public function before(RequestInterface $request, $arguments = null): ?ResponseInterface
    {
        if (! session()->get('user_id')) {
            return Services::response()
                ->setStatusCode(401)
                ->setJSON([
                    'error'     => 'Unauthorized',
                    'login_url' => '/login',
                ]);
        }

        return null;
    }

    /**
     * @param list<string>|null $arguments
     */
    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null): ResponseInterface
    {
        return $response;
    }
}
