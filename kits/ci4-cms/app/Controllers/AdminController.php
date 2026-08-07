<?php

declare(strict_types=1);

namespace App\Controllers;

use CodeIgniter\HTTP\RedirectResponse;

/**
 * Admin panel shell (roadmap 2.8 / ADR-002).
 *
 * The admin panel is a DevinimJS single-page app living under
 * /admin/#/... — CI4 only serves the HTML shell (a <div id="app"> plus the
 * CSRF meta tag); the hash router in public/assets/admin/app.js does the
 * rest. Server-side auth guard here is the real gate; the SPA's own
 * beforeEnter guards are UX only.
 */
class AdminController extends BaseController
{
    /**
     * GET /admin — session guard, then the SPA shell.
     */
    public function index(): string|RedirectResponse
    {
        if (! session()->get('user_id')) {
            return redirect()->to('/login');
        }

        // Only the shell is rendered — everything else happens in DevinimJS.
        return view('admin/shell', [
            'csrf_token' => csrf_hash(),
            'user'       => session()->get('user_email'),
        ]);
    }
}
