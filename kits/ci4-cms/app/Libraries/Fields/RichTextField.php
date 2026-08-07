<?php

declare(strict_types=1);

namespace App\Libraries\Fields;

/**
 * HTML body input (roadmap 2.3 'rich_text').
 *
 * Renders a plain textarea marked with data-field-type="rich_text"; the
 * admin SPA (or a plugin) may enhance it into a WYSIWYG editor.
 *
 * TRUST MODEL: the value is trusted HTML authored by logged-in admins and
 * is printed RAW by the public templates (themes/default/templates/*).
 * Never expose rich_text fields to untrusted users without adding a
 * sanitiser (e.g. HTMLPurifier) — see roadmap 2.10.
 */
class RichTextField extends BaseField
{
    public static function type(): string
    {
        return 'rich_text';
    }

    public function render(mixed $value = null): string
    {
        $value = $value ?? ($this->config['default'] ?? '');
        $rows  = max(4, (int) ($this->config['rows'] ?? 12));

        return $this->labelHtml()
            . '<textarea'
            . $this->baseAttr('textarea richtext')
            . ' rows="' . $rows . '"'
            . $this->requiredAttr()
            . '>' . esc((string) $value) . '</textarea>';
    }

    /** @return list<string> */
    public function validate(): array
    {
        // No max_length by default — article bodies are unbounded. Add one
        // via config { "maxLength": 50000 } when you need a cap.
        $rules = [];
        if (isset($this->config['maxLength']) && (int) $this->config['maxLength'] > 0) {
            $rules[] = 'max_length[' . (int) $this->config['maxLength'] . ']';
        }

        return $this->withRequired($rules);
    }
}
