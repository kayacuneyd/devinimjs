<?php

declare(strict_types=1);

namespace App\Libraries;

use CodeIgniter\Router\RouteCollection;

/**
 * Plugin discovery & boot (roadmap 2.5 / ADR-006).
 *
 * A plugin is a directory under app/Plugins/<Name>/ with a plugin.json
 * manifest:
 *
 *     {
 *       "name": "Blog", "slug": "blog", "version": "1.0.0", "active": true,
 *       "events": { "content.before_save": "App\\Plugins\\Blog\\...::method" }
 *     }
 *
 * boot() scans the directory once per request and, for every ACTIVE plugin:
 *   1. requires Config/Routes.php  — only when a RouteCollection is passed
 *      (i.e. from app/Config/Routes.php during route definition); the file
 *      sees $routes in scope and registers routes normally;
 *   2. requires Config/Hooks.php   — a plain PHP file that calls
 *      Hook::on(...) with closures;
 *   3. registers the manifest's `events` map via Hook::on(). Handler values
 *      must be callable strings ("Class::method") — anything else is
 *      skipped with a log line, never fatal.
 *
 * Namespaces: plugin classes live under App\Plugins\<Name>\... so the
 * appstarter's PSR-4 autoloader (App → APPPATH) finds them for free —
 * no custom autoloader, no eval(), no build step (ADR-006 "sandbox
 * enough": namespace isolation + hooks, not process isolation).
 */
class PluginLoader
{
    /** Whether Config/Hooks.php files + manifest events are registered. */
    private static bool $hooksBooted = false;

    /** Whether plugin route files have been loaded for this request. */
    private static bool $routesBooted = false;

    /** @var array<string, array<string, mixed>> Discovered manifests, keyed by slug. */
    private static array $plugins = [];

    /**
     * Boot all active plugins. Called twice in a normal request:
     * from app/Config/Routes.php (with $routes) and from
     * BaseController::initController() (without) — both halves are
     * idempotent.
     */
    public static function boot(?RouteCollection $routes = null): void
    {
        foreach (self::discover() as $plugin) {
            if (! ($plugin['active'] ?? false)) {
                continue;
            }

            $dir = $plugin['path'];

            if ($routes !== null && ! self::$routesBooted) {
                $routesFile = $dir . '/Config/Routes.php';
                if (is_file($routesFile)) {
                    // $routes stays in scope for the required file.
                    require $routesFile;
                }
            }

            if (! self::$hooksBooted) {
                $hooksFile = $dir . '/Config/Hooks.php';
                if (is_file($hooksFile)) {
                    require_once $hooksFile;
                }

                foreach ((array) ($plugin['events'] ?? []) as $event => $handler) {
                    if (is_callable($handler)) {
                        Hook::on((string) $event, $handler);
                    } else {
                        log_message('debug', '[ci4-cms] Plugin "{slug}": non-callable handler for "{event}" skipped.', [
                            'slug'  => $plugin['slug'],
                            'event' => $event,
                        ]);
                    }
                }
            }
        }

        if ($routes !== null) {
            self::$routesBooted = true;
        }
        self::$hooksBooted = true;
    }

    /**
     * Status report of every discovered plugin (active or not) — handy for
     * an admin "Plugins" screen or `php spark routes` debugging.
     *
     * @return list<array<string, mixed>>
     */
    public static function status(): array
    {
        $status = [];
        foreach (self::discover() as $plugin) {
            $status[] = [
                'slug'       => $plugin['slug'],
                'name'       => $plugin['name'] ?? $plugin['slug'],
                'version'    => $plugin['version'] ?? '0.0.0',
                'active'     => (bool) ($plugin['active'] ?? false),
                'path'       => $plugin['path'],
                'has_routes' => is_file($plugin['path'] . '/Config/Routes.php'),
                'has_hooks'  => is_file($plugin['path'] . '/Config/Hooks.php'),
                'events'     => array_keys((array) ($plugin['events'] ?? [])),
            ];
        }

        return $status;
    }

    /**
     * Scan app/Plugins/* once per request and parse manifests.
     *
     * @return array<string, array<string, mixed>> keyed by slug
     */
    private static function discover(): array
    {
        if (self::$plugins !== []) {
            return self::$plugins;
        }

        $dirs = glob(APPPATH . 'Plugins/*', GLOB_ONLYDIR) ?: [];

        foreach ($dirs as $dir) {
            $manifestFile = $dir . '/plugin.json';
            if (! is_file($manifestFile)) {
                continue;
            }

            $manifest = json_decode((string) file_get_contents($manifestFile), true);
            if (! is_array($manifest)) {
                log_message('error', '[ci4-cms] Invalid plugin.json in ' . $dir);
                continue;
            }

            $manifest['slug'] = (string) ($manifest['slug'] ?? basename($dir));
            $manifest['path'] = $dir;
            self::$plugins[$manifest['slug']] = $manifest;
        }

        return self::$plugins;
    }
}
