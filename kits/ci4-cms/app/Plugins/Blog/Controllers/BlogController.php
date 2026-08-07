<?php

declare(strict_types=1);

namespace App\Plugins\Blog\Controllers;

use App\Controllers\Api\BaseApiController;
use App\Models\ContentModel;
use App\Models\ContentTypeModel;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Blog plugin API — example endpoint proving the plugin architecture
 * (roadmap 2.5): routes from Config/Routes.php, hooks from
 * Config/Hooks.php + plugin.json, classes autoloaded via the standard
 * App\Plugins\* PSR-4 mapping.
 *
 *   GET /api/blog/stats → { data: { posts, published, drafts } }
 */
class BlogController extends BaseApiController
{
    /**
     * Post counts for the admin dashboard.
     */
    public function stats(): ResponseInterface
    {
        if (! $this->guardRead()) {
            return $this->response;
        }

        $type = (new ContentTypeModel())->findBySlug('post');
        if ($type === null) {
            return $this->failNotFound('The "post" content type is not installed.');
        }

        $typeId = (int) $type['id'];
        $model  = new ContentModel();

        $total = $model->where('type_id', $typeId)->countAllResults();
        $published = $model->where('type_id', $typeId)
            ->where('status', 'published')
            ->countAllResults();
        $drafts = $model->where('type_id', $typeId)
            ->where('status', 'draft')
            ->countAllResults();

        return $this->ok([
            'posts'     => $total,
            'published' => $published,
            'drafts'    => $drafts,
        ]);
    }

    /**
     * Manifest-driven listener (plugin.json "events"). Static "Class::method"
     * string style — the closure style lives in Config/Hooks.php.
     *
     * Example behaviour: cap auto-generated summaries at 500 chars.
     *
     * @param array<string, mixed> $content
     * @return array<string, mixed>
     */
    public static function beforeContentSave(array $content): array
    {
        if (isset($content['data']) && is_array($content['data'])) {
            $summary = $content['data']['summary'] ?? null;
            if (is_string($summary) && mb_strlen($summary) > 500) {
                $content['data']['summary'] = mb_substr($summary, 0, 500);
            }
        }

        return $content;
    }
}
