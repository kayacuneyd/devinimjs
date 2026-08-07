<?php

declare(strict_types=1);

namespace App\Libraries;

/**
 * Minimal WordPress-style filter hook system (roadmap 2.5 / ADR-006).
 *
 * Listeners are registered with Hook::on($event, $callback) and receive —
 * and must return — the payload, so chained listeners progressively
 * transform it:
 *
 *     Hook::on('content.before_save', static function (array $content): array {
 *         $content['slug'] = url_title($content['title'], '-', true);
 *         return $content;
 *     });
 *
 *     $content = Hook::trigger('content.before_save', $content);
 *
 * Static by design: hooks are request-scoped, process-global state.
 */
class Hook
{
    /** @var array<string, list<callable>> */
    private static array $hooks = [];

    /**
     * Register a listener for an event.
     */
    public static function on(string $event, callable $callback): void
    {
        self::$hooks[$event][] = $callback;
    }

    /**
     * Run an event's listener chain. Each listener gets the previous
     * listener's return value; the final value is returned to the caller.
     * With no listeners the payload passes through untouched.
     *
     * @param mixed $data
     * @return mixed
     */
    public static function trigger(string $event, $data = null)
    {
        if (! isset(self::$hooks[$event])) {
            return $data;
        }

        foreach (self::$hooks[$event] as $callback) {
            $data = $callback($data);
        }

        return $data;
    }

    /**
     * Introspection for PluginLoader::status() and debugging.
     *
     * @return array<string, int> event name → listener count
     */
    public static function registered(): array
    {
        $counts = [];
        foreach (self::$hooks as $event => $listeners) {
            $counts[$event] = count($listeners);
        }

        return $counts;
    }

    /**
     * Forget every listener. Intended for tests; production code should
     * never need this (listeners are request-scoped in PHP).
     */
    public static function reset(): void
    {
        self::$hooks = [];
    }
}
