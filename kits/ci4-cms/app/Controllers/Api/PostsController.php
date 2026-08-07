<?php

declare(strict_types=1);

namespace App\Controllers\Api;

/**
 * /api/posts — blog post CRUD (roadmap 2.4).
 *
 * All behaviour lives in ApiContentController; this class only binds the
 * resource to the `post` content type. Custom actions wired in
 * app/Config/Routes.php: publish/{id}, duplicate/{id}, search.
 */
class PostsController extends ApiContentController
{
    protected function typeSlug(): string
    {
        return 'post';
    }
}
