/**
 * @module core/validate
 * Rule-based client-side validation for build-free forms (ADR-0022). Rules are declared as
 * pipe-separated strings (`'required|email'`, `'required|number|min:18'`) or arrays of tokens;
 * {@link validate} returns an errors object shaped exactly like `createForm#setErrors` expects,
 * so client and server (CI4 `failValidationErrors`) share one error-rendering path.
 *
 * Built-in rules mirror the roadmap contract: required, email, url, number, min, max,
 * minLength, maxLength, pattern, match. A rule token takes an optional argument after the
 * first colon (`min:18`, `match:password`, `pattern:[a-z0-9-]+`). Pipe characters inside a
 * `pattern:` argument are not supported — keep expressions pipe-free.
 *
 * Deliberately **not** re-exported from `core/core.js` (size budget, ADR-0019 precedent);
 * import directly or via `core/app.js`.
 */

/** Pragmatic email check — full RFC 5322 validation stays the server's job. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Built-in rule implementations. Each returns true when the value passes. `arg` is the raw
 * string after the colon; `values` exposes the whole form for cross-field rules.
 *
 * @type {Record<string, (value: *, arg: string | undefined, values: Record<string, *>) => boolean>}
 */
const RULES = {
  required: (value) => !(value === undefined || value === null || String(value).trim() === ''),
  email: (value) => EMAIL_PATTERN.test(String(value)),
  url: (value) => {
    try {
      new URL(String(value));
      return true;
    } catch {
      return false;
    }
  },
  number: (value) => String(value).trim() !== '' && Number.isFinite(Number(value)),
  min: (value, arg) => Number(value) >= Number(arg),
  max: (value, arg) => Number(value) <= Number(arg),
  minLength: (value, arg) => String(value).length >= Number(arg),
  maxLength: (value, arg) => String(value).length <= Number(arg),
  pattern: (value, arg) => new RegExp(`^(?:${arg})$`).test(String(value)),
  match: (value, arg, values) => value === values[arg ?? ''],
};

/**
 * Default error messages (English; override per form or per rule via the `messages` argument —
 * Turkish apps pass their own map, matching the library's params-over-bundles i18n stance).
 *
 * @type {Record<string, (field: string, arg: string | undefined) => string>}
 */
const DEFAULT_MESSAGES = {
  required: () => 'This field is required.',
  email: () => 'Enter a valid email address.',
  url: () => 'Enter a valid URL.',
  number: () => 'Enter a valid number.',
  min: (_field, arg) => `Must be at least ${arg}.`,
  max: (_field, arg) => `Must be at most ${arg}.`,
  minLength: (_field, arg) => `Must be at least ${arg} characters.`,
  maxLength: (_field, arg) => `Must be at most ${arg} characters.`,
  pattern: () => 'Invalid format.',
  match: (_field, arg) => `Must match ${arg}.`,
};

/**
 * Splits one rule token into name and argument: `'min:18'` → `{ name: 'min', arg: '18' }`.
 * Only the first colon separates — pattern arguments keep their remaining colons.
 *
 * @param {string} token - One rule token.
 * @returns {{ name: string, arg: string | undefined }} Parsed rule.
 */
function parseRule(token) {
  const colon = token.indexOf(':');
  if (colon === -1) return { name: token.trim(), arg: undefined };
  return { name: token.slice(0, colon).trim(), arg: token.slice(colon + 1) };
}

/**
 * Normalizes a rule declaration into token form.
 *
 * @param {string | string[]} declaration - `'required|min:3'` or `['required', 'min:3']`.
 * @returns {string[]} Rule tokens.
 */
function toTokens(declaration) {
  return (Array.isArray(declaration) ? declaration : String(declaration).split('|'))
    .map((token) => token.trim())
    .filter(Boolean);
}

/**
 * @param {*} value - Field value.
 * @returns {boolean} True when the value counts as empty (absent, null or whitespace-only).
 */
function isEmpty(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

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
export function validate(values, rules, messages = {}) {
  /** @type {Record<string, string>} */
  const errors = {};

  for (const [field, declaration] of Object.entries(rules)) {
    const value = values[field];
    const tokens = toTokens(declaration);
    const optional = !tokens.some((token) => parseRule(token).name === 'required');
    if (optional && isEmpty(value)) continue;

    for (const token of tokens) {
      const { name, arg } = parseRule(token);
      const rule = RULES[name];
      if (!rule) {
        console.warn(`[devinim] validate: unknown rule "${name}" for field "${field}".`);
        continue;
      }
      if (rule(value, arg, values)) continue;
      errors[field] = messages[`${field}.${name}`] ?? messages[name] ?? DEFAULT_MESSAGES[name](field, arg);
      break; // first failure per field wins
    }
  }

  return errors;
}
