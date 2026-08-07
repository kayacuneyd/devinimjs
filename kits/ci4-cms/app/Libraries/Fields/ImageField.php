<?php

declare(strict_types=1);

namespace App\Libraries\Fields;

/**
 * Image picker. The stored value is the image URL string served by the
 * media library (e.g. "/uploads/abc123.png") — keeping contents.data
 * portable and human-readable (roadmap 2.3 example row).
 *
 * Renders a text input carrying data-field-type="image"; the admin SPA
 * recognises that marker and mounts a <dv-media-upload> next to it
 * (roadmap 2.6). A thumbnail <img> previews the current value.
 *
 * Config: { required, default }
 */
class ImageField extends BaseField
{
    public static function type(): string
    {
        return 'image';
    }

    public function render(mixed $value = null): string
    {
        $value   = (string) ($value ?? ($this->config['default'] ?? ''));
        $preview = $value !== ''
            ? '<img src="' . esc($value) . '" alt="" class="field-preview" loading="lazy" />'
            : '';

        return $this->labelHtml()
            . '<input type="text"'
            . $this->baseAttr('input')
            . ' value="' . esc($value) . '"'
            . $this->requiredAttr()
            . ' />'
            . $preview;
    }

    /** @return list<string> */
    public function validate(): array
    {
        return $this->withRequired(['max_length[500]']);
    }
}
