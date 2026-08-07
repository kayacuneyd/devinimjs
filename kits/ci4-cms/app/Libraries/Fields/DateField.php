<?php

declare(strict_types=1);

namespace App\Libraries\Fields;

/**
 * Date input (Y-m-d).
 *
 * Config: { required, default }
 */
class DateField extends BaseField
{
    public static function type(): string
    {
        return 'date';
    }

    public function render(mixed $value = null): string
    {
        $value = $value ?? ($this->config['default'] ?? '');

        return $this->labelHtml()
            . '<input type="date"'
            . $this->baseAttr('input')
            . ' value="' . esc((string) $value) . '"'
            . $this->requiredAttr()
            . ' />';
    }

    /** @return list<string> */
    public function validate(): array
    {
        return $this->withRequired(['valid_date[Y-m-d]']);
    }
}
