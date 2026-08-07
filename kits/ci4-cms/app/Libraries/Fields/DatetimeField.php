<?php

declare(strict_types=1);

namespace App\Libraries\Fields;

/**
 * Datetime input ("Y-m-d H:i:s"; renders the browser's datetime-local
 * control and converts the "T" separator on the way in).
 *
 * Config: { required, default }
 */
class DatetimeField extends BaseField
{
    public static function type(): string
    {
        return 'datetime';
    }

    public function render(mixed $value = null): string
    {
        $value = (string) ($value ?? ($this->config['default'] ?? ''));
        // Browser controls want "Y-m-d\TH:i"; storage wants "Y-m-d H:i:s".
        $input = str_replace(' ', 'T', substr($value, 0, 16));

        return $this->labelHtml()
            . '<input type="datetime-local"'
            . $this->baseAttr('input')
            . ' value="' . esc($input) . '"'
            . $this->requiredAttr()
            . ' />';
    }

    /** @return list<string> */
    public function validate(): array
    {
        // Accept either separator; normalize in the controller before save.
        return $this->withRequired(['regex_match[/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/]']);
    }
}
