<?php

declare(strict_types=1);

namespace App\Libraries\Fields;

use InvalidArgumentException;

/**
 * field_type string → Field instance (roadmap 2.3).
 *
 *     $field = FieldFactory::make($row['field_type'], $row['name'], $row['config']);
 *     echo $field->render($data[$row['name']] ?? null);
 *     $rules[$field->getName()] = implode('|', $field->validate());
 *
 * The map mirrors exactly the CHECK(...) list from the roadmap SQL:
 * text, textarea, rich_text, number, boolean, date, datetime, image,
 * file, select, multi_select, relation. Unknown types throw — callers
 * that validate user input first (ContentTypesController) can use
 * isSupported() for a friendly 422 instead.
 */
final class FieldFactory
{
    /** @var array<string, class-string<BaseField>> */
    private const MAP = [
        'text'         => TextField::class,
        'textarea'     => TextareaField::class,
        'rich_text'    => RichTextField::class,
        'number'       => NumberField::class,
        'boolean'      => BooleanField::class,
        'date'         => DateField::class,
        'datetime'     => DatetimeField::class,
        'image'        => ImageField::class,
        'file'         => FileField::class,
        'select'       => SelectField::class,
        'multi_select' => MultiSelectField::class,
        'relation'     => RelationField::class,
    ];

    /**
     * Build a field instance.
     *
     * @param array<string, mixed> $config JSON config from the fields table.
     *
     * @throws InvalidArgumentException on an unknown field_type
     */
    public static function make(string $type, string $name, array $config = []): BaseField
    {
        if (! isset(self::MAP[$type])) {
            throw new InvalidArgumentException(
                'Unknown field type "' . $type . '". Supported: ' . implode(', ', self::supported()) . '.'
            );
        }

        $class = self::MAP[$type];

        return new $class($name, $config);
    }

    public static function isSupported(string $type): bool
    {
        return isset(self::MAP[$type]);
    }

    /**
     * @return list<string> All supported field_type strings.
     */
    public static function supported(): array
    {
        return array_keys(self::MAP);
    }
}
