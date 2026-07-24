/**
 * @module core/i18n
 * Locale/i18n primitive for translatable component copy (ADR-0019): a three-tier resolution —
 * explicit `data-*` override (ADR-0005, unchanged) > active-locale bundle entry > hardcoded
 * fallback — plus a minimal `{placeholder}` substitution scheme for parameterized strings.
 *
 * Deliberately **not** re-exported from `core/core.js` — component files import it directly
 * from this module, mirroring `core/transition.js` (ADR-0018). `npm run size` only measures
 * `core.js` and whatever its export barrel re-exports (verified across TASK-004..007), so
 * keeping this import path separate keeps the primitive entirely outside the size-gated core
 * budget. See ADR-0019 for the in-budget-vs-standalone measurement that motivated this.
 *
 * This is not a full i18n framework: no ICU MessageFormat, no plural rules, no lazy-loaded
 * bundles, no date/number formatting — one resolution order, one substitution scheme
 * (ADR-0010 YAGNI, §2.1).
 */

/** @type {Map<string, Record<string, Record<string, string>>>} tagName -> { locale: { key: string } } */
const registry = new Map();

/** @type {Set<() => void>} Listeners notified whenever `setLocale()` changes the override. */
const listeners = new Set();

/** @type {string | null} Programmatic locale override (`setLocale()`); null defers to `<html lang>`. */
let localeOverride = null;

/** Locale used when neither `setLocale()` nor `document.documentElement.lang` supplies one. */
const DEFAULT_LOCALE = 'en';

/**
 * Registers a component's locale bundles. Call once per component module, at import time —
 * co-locate the bundle in that component's own file (or an adjacent sibling file), never in a
 * shared/centralized file, so wiring one more component never touches another's files.
 *
 * @param {string} tagName - The component's custom-element tag name (case-insensitive).
 * @param {Record<string, Record<string, string>>} locales - `{ en: { key: 'text', ... }, tr: {...} }`.
 * @returns {void}
 *
 * @example
 * registerLocales('dv-modal', {
 *   en: { label: 'Dialog', close: 'Close' },
 *   tr: { label: 'Pencere', close: 'Kapat' },
 * });
 */
export function registerLocales(tagName, locales) {
  registry.set(tagName.toLowerCase(), locales);
}

/**
 * Sets the programmatic active-locale override, applied ahead of `document.documentElement.lang`
 * (tier order documented in ADR-0019). Pass `null` to clear the override and defer back to
 * `<html lang>`. Notifies every `onLocaleChange()` listener synchronously — components typically
 * subscribe once, in `connected()`, and call `this.requestUpdate()` in response.
 *
 * @param {string | null} locale - Locale code (e.g. `'tr'`), or `null` to clear the override.
 * @returns {void}
 *
 * @example
 * setLocale('tr'); // switches every subscribed component to Turkish copy immediately
 */
export function setLocale(locale) {
  localeOverride = locale || null;
  for (const listener of listeners) listener();
}

/**
 * Resolves the active locale: the `setLocale()` override, else `document.documentElement.lang`,
 * else `'en'`. Read fresh on every call — nothing is cached.
 *
 * @returns {string} The active locale code.
 */
export function getLocale() {
  return localeOverride || document.documentElement.lang || DEFAULT_LOCALE;
}

/**
 * Subscribes to active-locale changes made via `setLocale()`. Does **not** fire on a bare
 * `document.documentElement.lang` mutation (no MutationObserver is installed — that mechanism is
 * an explicit re-render trigger by design, see `docs/guides/i18n.md`); call `setLocale()` (even
 * to the same value `<html lang>` would already resolve to) or trigger a re-render yourself
 * (e.g. `el.requestUpdate()`) when flipping `lang` directly.
 *
 * @param {() => void} listener - Called synchronously on every `setLocale()` call.
 * @returns {() => void} Unsubscribes.
 */
export function onLocaleChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Resolves one translatable string through the three-tier order (ADR-0019):
 * 1. `data-*` override on `el` for `key` (camelCase dataset key, e.g. `'confirmLabel'` →
 *    `data-confirm-label` — identical contract to `BaseComponent#str()`, ADR-0005).
 * 2. The active locale's bundle entry for `el`'s tag name and `key`, if one was registered via
 *    `registerLocales()`.
 * 3. `fallback`, unchanged.
 *
 * When `params` is given, `{placeholder}` tokens in the resolved string are replaced with the
 * matching `params` value (stringified) — a translator can reorder words around a placeholder,
 * not just have a value spliced into a fixed English sentence shape. Unmatched placeholders are
 * left as-is.
 *
 * @param {HTMLElement} el - The component instance (its `dataset` and tag name are read).
 * @param {string} key - camelCase key shared by the `data-*` attribute and the bundle entry.
 * @param {string} fallback - Hardcoded default when neither an override nor a bundle entry exists.
 * @param {Record<string, string | number>} [params] - Values substituted into `{placeholder}` tokens.
 * @returns {string} The resolved (and substituted, if `params` given) string.
 *
 * @example
 * t(this, 'label', 'Dialog'); // static
 * t(this, 'decreaseLabel', 'Decrease {name}', { name: item.name }); // parameterized
 */
export function t(el, key, fallback, params) {
  const override = el.dataset[key];
  const bundled = registry.get(el.nodeName.toLowerCase())?.[getLocale()]?.[key];
  const value = override !== undefined ? override : bundled !== undefined ? bundled : fallback;
  return params ? interpolate(value, params) : value;
}

/**
 * Replaces `{name}`-style placeholders with the matching `params` value. Unknown placeholders
 * are left untouched rather than replaced with an empty string, so a typo'd translation degrades
 * visibly instead of silently dropping words.
 *
 * @param {string} value - String possibly containing `{placeholder}` tokens.
 * @param {Record<string, string | number>} params - Substitution values.
 * @returns {string} The substituted string.
 */
function interpolate(value, params) {
  return value.replace(/\{(\w+)\}/g, (match, name) => (
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
  ));
}
