<?php

declare(strict_types=1);

namespace App\Libraries\Fields;

/**
 * Single-choice dropdown. Options come from config:
 *
 *   { "options": ["draft", "published"] }
 *   { "options": [{"value": "tr", "label": "Türkçe"}, ...] }
 *
 * Config also: { required, default, placeholder }
 */
class SelectField extends BaseField
{
    public static function type(): string
    {
        return 'select';
    }

    public function render(mixed $value = null): string
    {
        $current = (string) ($value ?? ($this->config['default'] ?? ''));

        $html = $this->labelHtml()
            . '<select' . $this->baseAttr('select') . $this->requiredAttr() . '>';

        if (isset($this->config['placeholder'])) {
            $html .= '<option value="">' . esc((string) $this->config['placeholder']) . '</option>';
        }

        foreach ($this->options() as $optionValue => $optionLabel) {
            $selected = $optionValue === $current ? ' selected' : '';
            $html    .= '<option value="' . esc($optionValue) . '"' . $selected . '>'
                . esc($optionLabel) . '</option>';
        }

        return $html . '</select>';
    }

    /** @return list<string> */
    public function validate(): array
    {
        $values = array_keys($this->options());
        $rules  = $values === [] ? [] : ['in_list[' . implode(',', $values) . ']'];

        return $this->withRequired($rules);
    }

    /**
     * Normalized options as value → label pairs.
     *
     * @return array<string, string>
     */
    protected function options(): array
    {
        $options = [];
        foreach ((array) ($this->config['options'] ?? []) as $option) {
            if (is_array($option)) {
                $optionValue          = (string) ($option['value'] ?? '');
                $options[$optionValue] = (string) ($option['label'] ?? $optionValue);
            } else {
                $options[(string) $option] = (string) $option;
            }
        }

        return $options;
    }
}
