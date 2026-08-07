<?php

declare(strict_types=1);

namespace App\Libraries\Fields;

/**
 * Numeric input.
 *
 * Config: { required, min, max, step, integer: true, default }
 */
class NumberField extends BaseField
{
    public static function type(): string
    {
        return 'number';
    }

    public function render(mixed $value = null): string
    {
        $value = $value ?? ($this->config['default'] ?? '');
        $extra = '';
        foreach (['min', 'max', 'step'] as $attr) {
            if (isset($this->config[$attr]) && is_numeric($this->config[$attr])) {
                $extra .= ' ' . $attr . '="' . esc((string) $this->config[$attr]) . '"';
            }
        }

        return $this->labelHtml()
            . '<input type="number"'
            . $this->baseAttr('input')
            . ' value="' . esc((string) $value) . '"'
            . $extra
            . $this->requiredAttr()
            . ' />';
    }

    /** @return list<string> */
    public function validate(): array
    {
        $rules = [($this->config['integer'] ?? false) ? 'integer' : 'numeric'];
        if (isset($this->config['min']) && is_numeric($this->config['min'])) {
            $rules[] = 'greater_than_equal_to[' . $this->config['min'] . ']';
        }
        if (isset($this->config['max']) && is_numeric($this->config['max'])) {
            $rules[] = 'less_than_equal_to[' . $this->config['max'] . ']';
        }

        return $this->withRequired($rules);
    }
}
