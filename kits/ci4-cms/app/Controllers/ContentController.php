<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Models\ContentModel;
use App\Models\ContentTypeModel;
use CodeIgniter\Exceptions\PageNotFoundException;
use Config\Services;

/**
 * Public site controller (roadmap 2.8/2.9).
 *
 * Server-rendered, SEO-friendly pages themed by app/Views/themes/default/*.
 * Interactive islands inside the templates are mounted by DevinimJS
 * components (see templates/post.php for a dv-like-button example).
 */
class ContentController extends BaseController
{
    /** Number of posts per archive page. */
    protected int $perPage = 10;

    protected ContentModel $contentModel;

    protected ContentTypeModel $contentTypes;

    public function __construct()
    {
        $this->contentModel = new ContentModel();
        $this->contentTypes = new ContentTypeModel();
    }

    /**
     * GET / — latest published blog posts on the archive template.
     */
    public function home(): string
    {
        $posts = $this->contentModel->getByType('post', 6);

        return view('themes/default/templates/archive', [
            'posts'     => $posts,
            'type'      => $this->contentTypes->findBySlug('post'),
            'heading'   => 'Son Yazılar',
            'pager'     => null,
            'meta'      => [
                'title'       => 'Ana Sayfa',
                'description' => 'DevinimJS + CodeIgniter 4 ile güçlendirilmiş CMS',
            ],
        ]);
    }

    /**
     * GET /blog/{slug} and /sayfa/{slug} — single published content.
     *
     * The template is chosen from the content type slug
     * (themes/default/templates/{post|page}.php).
     *
     * @throws PageNotFoundException
     */
    public function show(string $slug): string
    {
        $post = $this->contentModel->getBySlug($slug);

        if ($post === null) {
            throw new PageNotFoundException('Cannot find the content: ' . $slug);
        }

        $type        = $this->contentTypes->find($post['type_id']);
        $typeSlug    = is_array($type) ? (string) ($type['slug'] ?? 'post') : 'post';
        $template    = in_array($typeSlug, ['post', 'page'], true) ? $typeSlug : 'post';
        $contentData = is_array($post['data'] ?? null) ? $post['data'] : [];

        return view('themes/default/templates/' . $template, [
            'post'  => $post,
            'type'  => $type,
            'theme' => 'default',
            'meta'  => [
                'title'       => $post['title'],
                'description' => (string) ($contentData['summary'] ?? ''),
            ],
        ]);
    }

    /**
     * GET /arsiv/{typeSlug} — paginated list of published content by type.
     *
     * @throws PageNotFoundException
     */
    public function archive(string $typeSlug = 'post'): string
    {
        $type = $this->contentTypes->findBySlug($typeSlug);

        if ($type === null) {
            throw new PageNotFoundException('Cannot find the content type: ' . $typeSlug);
        }

        $page  = max(1, (int) ($this->request->getGet('page') ?? 1));
        $total = $this->contentModel->countByType($typeSlug);
        $posts = $this->contentModel->getByType($typeSlug, $this->perPage, ($page - 1) * $this->perPage);

        $pager = Services::pager();
        $pager->setPath(current_url()->getPath());

        return view('themes/default/templates/archive', [
            'posts'   => $posts,
            'type'    => $type,
            'heading' => $type['name'],
            'pager'   => $pager,
            'page'    => $page,
            'perPage' => $this->perPage,
            'total'   => $total,
            'meta'    => [
                'title'       => $type['name'],
                'description' => (string) ($type['description'] ?? ''),
            ],
        ]);
    }
}
