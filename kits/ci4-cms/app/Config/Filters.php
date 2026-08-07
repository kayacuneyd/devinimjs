<?php

declare(strict_types=1);

namespace Config;

use App\Filters\ApiAuthFilter;
use CodeIgniter\Config\Filters as BaseFilters;
use CodeIgniter\Filters\Cors;
use CodeIgniter\Filters\CSRF;
use CodeIgniter\Filters\DebugToolbar;
use CodeIgniter\Filters\ForceHTTPS;
use CodeIgniter\Filters\Honeypot;
use CodeIgniter\Filters\InvalidChars;
use CodeIgniter\Filters\PageCache;
use CodeIgniter\Filters\PerformanceMetrics;
use CodeIgniter\Filters\SecureHeaders;

/**
 * Filters configuration — shipped in full by the kit so the `apiAuth` alias
 * (roadmap 2.10) is registered without any manual editing.
 *
 * CSRF note: CI4's own `csrf` filter is intentionally NOT enabled globally.
 * The kit's API is consumed exclusively by the DevinimJS admin SPA, which
 * sends the session-bound token as the `X-CSRF-TOKEN` header; every
 * state-changing API endpoint verifies it against csrf_hash() via
 * BaseApiController::verifyCsrfHeader(). If you add public HTML forms,
 * enable the `csrf` filter in $globals below instead (and you may then drop
 * the header check).
 */
class Filters extends BaseFilters
{
    /**
     * Configures aliases for Filter classes to make reading things nicer.
     *
     * @var array<string, class-string|list<class-string>>
     */
    public array $aliases = [
        'csrf'          => CSRF::class,
        'toolbar'       => DebugToolbar::class,
        'honeypot'      => Honeypot::class,
        'invalidchars'  => InvalidChars::class,
        'secureheaders' => SecureHeaders::class,
        'cors'          => Cors::class,
        'forcehttps'    => ForceHTTPS::class,
        'pagecache'     => PageCache::class,
        'performance'   => PerformanceMetrics::class,
        'apiAuth'       => ApiAuthFilter::class, // kit: session guard for the /api group (roadmap 2.10)
    ];

    /**
     * List of filter aliases that are always applied before and after every request.
     *
     * @var array<string, array<string, array<string, string>>>|array<string, list<string>>
     */
    public array $globals = [
        'before' => [
            // 'honeypot',
            // 'csrf', // enable for classic server-rendered forms — see class docblock
            // 'invalidchars',
        ],
        'after' => [
            'toolbar',
            // 'honeypot',
            // 'secureheaders',
        ],
    ];

    /**
     * List of filter aliases that work on a particular HTTP method.
     *
     * @var array<string, list<string>>
     */
    public array $methods = [];

    /**
     * List of filter aliases that should run on any before/after URI patterns.
     *
     * @var array<string, array<string, list<string>>>
     */
    public array $filters = [];
}
