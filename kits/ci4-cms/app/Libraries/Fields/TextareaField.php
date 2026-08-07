<?php

declare(strict_types=1);

namespace App\Libraries\Fields;

/**
 * Multi-line plain-text input.
 *
 * Config: { required, maxLength, rows, placeholder, default }
 */
class TextareaField extends BaseField
{
    public static function type(): string
    {
        return 'textarea';
    }

    public function render(mixed $value = null): string
    {
        $value = $value ?? ($this->config['default'] ?? '');
        $rows  = max(2, (int) ($this->config['rows'] ?? 4));
        $placeholder = isset($this->config['placeholder'])
            ? ' placeholder="' . esc((string) $this->config['placeholder']) . '"'
            : '';

        return $this->labelHtml()
            . '<textarea'
            . $this->baseAttr('textarea')
            . ' rows="' . $rows . '"'
            . $placeholder
            . $this->requiredAttr()
            . '>' . esc((string) $value) . '</textarea>';
    }

    /** @return list<string> */
    public function validate(): array
    {
        $maxLength = (int) ($this->config['maxLength'] ?? 5000);

        return $this->withRequired(['max_length[' . ($maxLength > 0 ? $maxLength : 5000) . ']']);
    }
}
