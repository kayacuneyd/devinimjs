<?php

declare(strict_types=1);

namespace App\Libraries\Fields;

/**
 * Multiple-choice dropdown — submits an array ("name[]") and stores a
 * JSON list in contents.data. Options use the same config shape as
 * SelectField: { "options": [...] } plus { required, size }.
 *
 * VALIDATION NOTE: because the value is an array, apply validate() rules
 * to "name.*" (each element) — isMultiple() flags this for consumers:
 *
 *   $rules[$field->getName()]      = 'permit_empty';
 *   $rules[$field->getName() . '.*'] = implode('|', $field->validate());
 */
class MultiSelectField extends BaseField
{
    public static function type(): string
    {
        return 'multi_select';
    }

    public function isMultiple(): bool
    {
        return true;
    }

    public function render(mixed $value = null): string
    {
        $current = is_array($value) ? array_map('strval', $value) : [];
        $size    = max(2, (int) ($this->config['size'] ?? 5));

        $html = $this->labelHtml()
            . '<select' . $this->baseAttr('select', $this->name . '[]')
            . ' multiple size="' . $size . '"' . $this->requiredAttr() . '>';

        foreach ($this->options() as $optionValue => $optionLabel) {
            $selected = in_array($optionValue, $current, true) ? ' selected' : '';
            $html    .= '<option value="' . esc($optionValue) . '"' . $selected . '>'
                . esc($optionLabel) . '</option>';
        }

        return $html . '</select>';
    }

    /**
     * Per-ELEMENT rules — see the class docblock for how to apply them.
     *
     * @return list<string>
     */
    public function validate(): array
    {
        $values = array_keys($this->options());

        return $values === [] ? [] : ['in_list[' . implode(',', $values) . ']'];
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
                $optionValue           = (string) ($option['value'] ?? '');
                $options[$optionValue] = (string) ($option['label'] ?? $optionValue);
            } else {
                $options[(string) $option] = (string) $option;
            }
        }

        return $options;
    }
}
