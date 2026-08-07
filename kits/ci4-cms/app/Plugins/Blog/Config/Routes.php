<?php

declare(strict_types=1);

/**
 * Blog plugin routes — required by App\Libraries\PluginLoader::boot()
 * from app/Config/Routes.php, so the shared $routes collection is in
 * scope here exactly as it is in the main routes file.
 *
 * Registers GET /api/blog/stats behind the same apiAuth session filter
 * as the core API.
 *
 * @var CodeIgniter\Router\RouteCollection $routes
 */

$routes->group('api', ['namespace' => 'App\Plugins\Blog\Controllers', 'filter' => 'apiAuth'], static function ($routes): void {
    $routes->get('blog/stats', 'BlogController::stats');
});
