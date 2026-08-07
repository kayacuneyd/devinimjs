<?php

declare(strict_types=1);

/**
 * Blog plugin hook listeners — required once per request by
 * App\Libraries\PluginLoader::boot(). This is the closure style of
 * listener registration; the manifest "events" map in plugin.json
 * (static "Class::method" strings) works too — both are active here as a
 * reference for plugin authors.
 */

use App\Libraries\Hook;

helper('text');

// Example listener (roadmap 2.5): make sure a missing slug is derived
// from the title before a post is saved. The core controller already
// does this — think of it as a documented extension point: a real plugin
// might auto-generate excerpts, ping search indexes, etc.
Hook::on('content.before_save', static function (array $content): array {
    if (empty($content['slug']) && ! empty($content['title'])) {
        $content['slug'] = url_title((string) $content['title'], '-', true);
    }

    return $content;
});
