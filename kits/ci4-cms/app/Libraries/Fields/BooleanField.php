<?php

declare(strict_types=1);

namespace App\Libraries\Fields;

/**
 * Checkbox-style boolean (stored as 0/1 in the JSON data column).
 *
 * Config: { required, default: false }
 */
class BooleanField extends BaseField
{
    public static function type(): string
    {
        return 'boolean';
    }

    public function render(mixed $value = null): string
    {
        $checked = $value ?? ($this->config['default'] ?? false);
        $checked = filter_var($checked, FILTER_VALIDATE_BOOLEAN);

        return '<div class="field field-inline">'
            . '<input type="hidden" name="' . esc($this->name) . '" value="0" />'
            . '<input type="checkbox"'
            . $this->baseAttr('checkbox')
            . ' value="1"'
            . ($checked ? ' checked' : '')
            . ' />'
            . $this->labelHtml()
            . '</div>';
    }

    /** @return list<string> */
    public function validate(): array
    {
        // An unchecked box submits the hidden 0; both are valid.
        return $this->withRequired(['in_list[0,1]']);
    }
}
