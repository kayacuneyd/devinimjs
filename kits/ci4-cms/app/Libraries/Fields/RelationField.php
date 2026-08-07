<?php

declare(strict_types=1);

namespace App\Libraries\Fields;

use App\Models\ContentModel;
use App\Models\ContentTypeModel;

/**
 * Relation to another content record — options are pulled live from the
 * related content type named in config:
 *
 *   { "content_type": "post", "required": false }
 *
 * The stored value is the related row's contents.id. Options are loaded
 * at render time (newest 200 of the type) — fine for admin forms; for
 * very large related sets, swap render() for an autocomplete endpoint.
 */
class RelationField extends BaseField
{
    public static function type(): string
    {
        return 'relation';
    }

    public function render(mixed $value = null): string
    {
        $current = (string) ($value ?? '');

        $html = $this->labelHtml()
            . '<select' . $this->baseAttr('select') . $this->requiredAttr() . '>'
            . '<option value="">—</option>';

        foreach ($this->relatedOptions() as $id => $title) {
            $selected = (string) $id === $current ? ' selected' : '';
            $html    .= '<option value="' . esc((string) $id) . '"' . $selected . '>'
                . esc($title) . '</option>';
        }

        return $html . '</select>';
    }

    /** @return list<string> */
    public function validate(): array
    {
        // is_not_unique guarantees the id points at a real content row.
        return $this->withRequired(['integer', 'is_not_unique[contents.id]']);
    }

    /**
     * id → title options from the configured content type.
     *
     * @return array<int, string>
     */
    protected function relatedOptions(): array
    {
        $typeSlug = (string) ($this->config['content_type'] ?? '');
        if ($typeSlug === '') {
            return [];
        }

        $type = (new ContentTypeModel())->findBySlug($typeSlug);
        if ($type === null) {
            return [];
        }

        $rows = (new ContentModel())
            ->select('id, title')
            ->where('type_id', (int) $type['id'])
            ->orderBy('id', 'DESC')
            ->findAll(200);

        $options = [];
        foreach ($rows as $row) {
            $options[(int) $row['id']] = (string) $row['title'];
        }

        return $options;
    }
}
