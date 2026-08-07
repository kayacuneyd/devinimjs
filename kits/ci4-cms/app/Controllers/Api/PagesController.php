<?php

declare(strict_types=1);

namespace App\Controllers\Api;

/**
 * /api/pages — static page CRUD (roadmap 2.4).
 *
 * Identical machinery to PostsController (shared via ApiContentController),
 * restricted to the `page` content type. Publish/duplicate/search are
 * inherited too; wire routes for them in app/Config/Routes.php if the
 * admin UI needs them for pages.
 */
class PagesController extends ApiContentController
{
    protected function typeSlug(): string
    {
        return 'page';
    }
}
