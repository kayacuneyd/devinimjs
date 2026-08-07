<?php

declare(strict_types=1);

namespace App\Libraries\Fields;

/**
 * Single-line text input (roadmap 2.3 sketch, fleshed out).
 *
 * Config: { required, minLength, maxLength, placeholder, default }
 */
class TextField extends BaseField
{
    public static function type(): string
    {
        return 'text';
    }

    public function render(mixed $value = null): string
    {
        $value       = $value ?? ($this->config['default'] ?? '');
        $placeholder = isset($this->config['placeholder'])
            ? ' placeholder="' . esc((string) $this->config['placeholder']) . '"'
            : '';

        return $this->labelHtml()
            . '<input type="text"'
            . $this->baseAttr('input')
            . ' value="' . esc((string) $value) . '"'
            . $placeholder
            . $this->requiredAttr()
            . ' />';
    }

    /** @return list<string> */
    public function validate(): array
    {
        $rules = [];
        if (isset($this->config['minLength']) && (int) $this->config['minLength'] > 0) {
            $rules[] = 'min_length[' . (int) $this->config['minLength'] . ']';
        }
        $maxLength = (int) ($this->config['maxLength'] ?? 255);
        $rules[]   = 'max_length[' . ($maxLength > 0 ? $maxLength : 255) . ']';

        return $this->withRequired($rules);
    }
}
