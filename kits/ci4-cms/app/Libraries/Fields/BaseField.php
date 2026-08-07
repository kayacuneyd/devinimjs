<?php

declare(strict_types=1);

namespace App\Libraries\Fields;

/**
 * Base class for the dynamic field type library (roadmap 2.3/2.5).
 *
 * A field knows two things:
 *   - render($value) → admin HTML for the input (CKCSS-friendly classes
 *     'input' / 'textarea' / 'select' so the panels stay themeable);
 *   - validate()     → CI4 validation rule fragments for the value
 *     (['required', 'min_length[2]', 'max_length[255]', ...]).
 *
 * Every piece of output is escaped with esc() — fields never trust stored
 * or submitted values (roadmap 2.10).
 *
 * `config` is the JSON object from the fields table:
 * { options: [...], required: true, default: ..., minLength: 10, ... }
 */
abstract class BaseField
{
    /**
     * @param string $name   Field name (contents.data key / column name).
     * @param array<string, mixed> $config JSON config from the fields table.
     */
    public function __construct(
        protected string $name,
        protected array $config = [],
    ) {
    }

    /**
     * Render the admin input for this field.
     *
     * @param mixed $value Current stored value (null for new records).
     */
    abstract public function render(mixed $value = null): string;

    /**
     * CI4 validation rules for the submitted value, e.g.
     * ['required', 'min_length[2]']. Compose them under the field name:
     * $rules[$field->getName()] = implode('|', $field->validate());
     *
     * @return list<string>
     */
    abstract public function validate(): array;

    public function getName(): string
    {
        return $this->name;
    }

    /**
     * True when the field submits an array of values (multi_select) —
     * apply validate() rules to "name.*" instead of "name".
     */
    public function isMultiple(): bool
    {
        return false;
    }

    /** Config-driven required flag shared by all concrete fields. */
    protected function isRequired(): bool
    {
        return (bool) ($this->config['required'] ?? false);
    }

    /** Label text: config label, falling back to a humanised name. */
    protected function label(): string
    {
        $label = (string) ($this->config['label'] ?? '');

        return $label !== '' ? $label : ucwords(str_replace('_', ' ', $this->name));
    }

    /**
     * The <label> + wrapper opening shared by all renders. The for/id
     * wiring keeps the markup accessible out of the box.
     */
    protected function labelHtml(): string
    {
        return '<label class="label" for="field-' . esc($this->name) . '">'
            . esc($this->label())
            . ($this->isRequired() ? ' <span class="text-danger" aria-hidden="true">*</span>' : '')
            . '</label>';
    }

    /** HTML required attribute fragment (' required' or ''). */
    protected function requiredAttr(): string
    {
        return $this->isRequired() ? ' required' : '';
    }

    /**
     * name/id/class attributes common to every input.
     */
    protected function baseAttr(string $class, ?string $name = null): string
    {
        return ' name="' . esc($name ?? $this->name) . '"'
            . ' id="field-' . esc($this->name) . '"'
            . ' class="' . esc($class) . '"'
            . ' data-field-type="' . esc(static::type()) . '"';
    }

    /**
     * The field_type string this class handles — filled by concrete
     * classes, used for data-field-type so the admin SPA can enhance
     * specific inputs (e.g. swap image fields for <dv-media-upload>).
     */
    abstract public static function type(): string;

    /** Prepend the required rule when configured. */
    protected function withRequired(array $rules): array
    {
        if ($this->isRequired()) {
            array_unshift($rules, 'required');
        }

        return $rules;
    }
}
