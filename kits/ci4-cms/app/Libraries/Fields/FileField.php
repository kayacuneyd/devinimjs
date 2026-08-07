<?php

declare(strict_types=1);

namespace App\Libraries\Fields;

/**
 * File picker — like ImageField but for arbitrary uploads; the stored
 * value is the file URL string from the media library.
 *
 * Config: { required, default }
 */
class FileField extends BaseField
{
    public static function type(): string
    {
        return 'file';
    }

    public function render(mixed $value = null): string
    {
        $value = (string) ($value ?? ($this->config['default'] ?? ''));
        $link  = $value !== ''
            ? '<a href="' . esc($value) . '" class="field-file-link" target="_blank" rel="noopener">'
                . esc(basename($value)) . '</a>'
            : '';

        return $this->labelHtml()
            . '<input type="text"'
            . $this->baseAttr('input')
            . ' value="' . esc($value) . '"'
            . $this->requiredAttr()
            . ' />'
            . $link;
    }

    /** @return list<string> */
    public function validate(): array
    {
        return $this->withRequired(['max_length[500]']);
    }
}
