/**
 * Validates `values` against `rules` and returns the first error message per field. Fields
 * that are empty *and* not `required` skip their remaining rules — optional fields stay
 * optional until filled.
 *
 * @param {Record<string, *>} values - Field values keyed by input name.
 * @param {Record<string, string | string[]>} rules - Rule declarations keyed by field name.
 * @param {Record<string, string>} [messages] - Message overrides: `'<field>.<rule>'` first,
 *   then `'<rule>'`, then the built-in default.
 * @returns {Record<string, string>} Errors keyed by field name; empty when valid.
 *
 * @example
 * const errors = validate(formData, {
 *   email: 'required|email',
 *   age: 'required|number|min:18',
 *   confirm: 'match:password',
 * });
 * if (Object.keys(errors).length > 0) form.setErrors(errors);
 */
export function validate(values: Record<string, any>, rules: Record<string, string | string[]>, messages?: Record<string, string>): Record<string, string>;
