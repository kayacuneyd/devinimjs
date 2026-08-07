<?php

declare(strict_types=1);

use App\Libraries\PluginLoader;
use CodeIgniter\Router\RouteCollection;

/**
 * DevinimJS ci4-cms kit — route definitions.
 *
 * Routing split (roadmap 2.8 / ADR-002):
 *   - Public site  : CI4 server-side routing, SEO friendly (example.com/blog/hello-world)
 *   - Admin panel  : one CI4 route serving the shell; everything below /admin/#/... is
 *                    handled by the DevinimJS hash router in public/assets/admin/app.js
 *   - REST API     : /api/* resource controllers behind the `apiAuth` session filter
 *
 * @var RouteCollection $routes
 */

// -----------------------------------------------------------------------
// Public site
// -----------------------------------------------------------------------
$routes->get('/', 'ContentController::home');
$routes->get('blog/(:segment)', 'ContentController::show/$1');
$routes->get('sayfa/(:segment)', 'ContentController::show/$1');
$routes->get('arsiv/(:segment)', 'ContentController::archive/$1');
// English aliases — keep or delete to taste:
$routes->get('page/(:segment)', 'ContentController::show/$1');
$routes->get('archive/(:segment)', 'ContentController::archive/$1');

// -----------------------------------------------------------------------
// Auth (roadmap 2.2 — simple session auth, ADR-004)
// -----------------------------------------------------------------------
$routes->get('login', 'AuthController::loginForm');
$routes->post('auth/login', 'AuthController::login');
$routes->get('logout', 'AuthController::logout');
$routes->post('auth/logout', 'AuthController::logout');

// -----------------------------------------------------------------------
// Admin shell (DevinimJS SPA mount point — the hash router owns everything
// below /admin/#/... so a single CI4 route is all we need)
// -----------------------------------------------------------------------
$routes->get('admin', 'AdminController::index');

// -----------------------------------------------------------------------
// REST API (roadmap 2.4) — session guard via the `apiAuth` filter alias
// registered in app/Config/Filters.php (roadmap 2.10).
//
// NOTE: the custom post routes are declared BEFORE $routes->resource('posts')
// so that `api/posts/search` is not swallowed by the resource `show` route
// (`api/posts/(:segment)`). CI4 matches routes in declaration order.
// -----------------------------------------------------------------------
$routes->group('api', ['namespace' => 'App\Controllers\Api', 'filter' => 'apiAuth'], static function (RouteCollection $routes): void {
    $routes->get('posts/search', 'PostsController::search');
    $routes->post('posts/(:num)/publish', 'PostsController::publish/$1');
    $routes->post('posts/(:num)/duplicate', 'PostsController::duplicate/$1');

    $routes->resource('posts', ['controller' => 'PostsController', 'except' => 'new,edit']);
    $routes->resource('pages', ['controller' => 'PagesController', 'except' => 'new,edit']);
    $routes->resource('users', ['controller' => 'UsersController', 'except' => 'new,edit']);
    $routes->resource('content-types', ['controller' => 'ContentTypesController', 'except' => 'new,edit']);

    // Media: resource gives index/show/delete; uploads go to upload() (roadmap 2.6).
    $routes->post('media/upload', 'MediaController::upload');
    $routes->resource('media', ['controller' => 'MediaController', 'except' => 'new,edit,create,update']);
});

// -----------------------------------------------------------------------
// Plugin routes (roadmap 2.5)
//
// PluginLoader::boot() scans app/Plugins/ — every active plugin with a
// Config/Routes.php file gets it required right here, with this same
// $routes collection in scope, so plugins register their routes exactly
// like the block above. Plugin Config/Hooks.php files and plugin.json
// `events` listeners are registered at the same time (and again on every
// controller boot via BaseController, so hooks fire even when routes were
// cached/resolved without this file being re-read for the plugin).
// -----------------------------------------------------------------------
PluginLoader::boot($routes);
