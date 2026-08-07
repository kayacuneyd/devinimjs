<?php

declare(strict_types=1);

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

/**
 * The starter content types (roadmap 6 checklist, "İlk Content Type"):
 *
 *   Blog Post (post): title, slug, summary (textarea), body (rich_text),
 *                     cover_image (image), status (select)
 *   Page      (page): title, slug, body (rich_text)
 *
 * title/slug/status are real columns on `contents`; they still appear as
 * field definitions so the admin editor knows how to label and order the
 * form — ApiContentController keeps them out of the JSON `data` column.
 *
 * Idempotent: existing slugs are skipped, so re-seeding is safe.
 */
class ContentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedType(
            [
                'name'        => 'Blog Post',
                'slug'        => 'post',
                'description' => 'Zaman damgalı blog yazıları',
                'icon'        => 'article',
            ],
            [
                ['name' => 'title',       'label' => 'Başlık',      'field_type' => 'text',      'config' => ['required' => true, 'maxLength' => 255]],
                ['name' => 'slug',        'label' => 'Slug',        'field_type' => 'text',      'config' => ['maxLength' => 255]],
                ['name' => 'summary',     'label' => 'Özet',        'field_type' => 'textarea',  'config' => ['maxLength' => 500]],
                ['name' => 'body',        'label' => 'İçerik',      'field_type' => 'rich_text', 'config' => ['required' => true]],
                ['name' => 'cover_image', 'label' => 'Kapak Görseli', 'field_type' => 'image',   'config' => []],
                ['name' => 'status',      'label' => 'Durum',       'field_type' => 'select',    'config' => ['options' => ['draft', 'published', 'archived'], 'default' => 'draft']],
            ]
        );

        $this->seedType(
            [
                'name'        => 'Page',
                'slug'        => 'page',
                'description' => 'Sabit sayfalar (Hakkında, İletişim, ...)',
                'icon'        => 'file',
            ],
            [
                ['name' => 'title', 'label' => 'Başlık', 'field_type' => 'text',      'config' => ['required' => true, 'maxLength' => 255]],
                ['name' => 'slug',  'label' => 'Slug',   'field_type' => 'text',      'config' => ['maxLength' => 255]],
                ['name' => 'body',  'label' => 'İçerik', 'field_type' => 'rich_text', 'config' => ['required' => true]],
            ]
        );
    }

    /**
     * Insert one content type plus its field definitions.
     *
     * @param array<string, string> $type
     * @param list<array<string, mixed>> $fields
     */
    private function seedType(array $type, array $fields): void
    {
        $exists = $this->db->table('content_types')->where('slug', $type['slug'])->countAllResults();
        if ($exists > 0) {
            return;
        }

        $type['created_at'] = date('Y-m-d H:i:s');
        $this->db->table('content_types')->insert($type);
        $typeId = (int) $this->db->insertID();

        foreach (array_values($fields) as $sort => $field) {
            $this->db->table('fields')->insert([
                'type_id'    => $typeId,
                'name'       => $field['name'],
                'label'      => $field['label'],
                'field_type' => $field['field_type'],
                'config'     => json_encode($field['config'], JSON_UNESCAPED_UNICODE),
                'sort_order' => $sort,
            ]);
        }
    }
}
