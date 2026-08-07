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
export function registerLocales(tagName: string, locales: Record<string, Record<string, string>>): void;
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
export function setLocale(locale: string | null): void;
/**
 * Resolves the active locale: the `setLocale()` override, else `document.documentElement.lang`,
 * else `'en'`. Read fresh on every call — nothing is cached.
 *
 * @returns {string} The active locale code.
 */
export function getLocale(): string;
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
export function onLocaleChange(listener: () => void): () => void;
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
export function t(el: HTMLElement, key: string, fallback: string, params?: Record<string, string | number>): string;
/**
 * Creates an application-level message catalog (ADR-0024) on top of the component-locale
 * primitive. Resolution: active-locale entry → `fallbackLocale` entry → the key itself (a
 * missing translation degrades visibly, mirroring the primitive's typo policy). When
 * `params.count` is a number and the resolved entry contains pipes, pluralization selects the
 * form *before* `{placeholder}` interpolation runs.
 *
 * `setLocale()` forwards to the primitive's module-level setter, so every component that
 * subscribed via `onLocaleChange()` re-renders on an app-level language switch.
 *
 * @param {{
 *   locale?: string | null,
 *   fallbackLocale?: string,
 *   messages?: Record<string, Record<string, string>>,
 * }} [config] - Catalog configuration.
 * @returns {{ readonly locale: string, readonly fallbackLocale: string, setLocale: (locale: string | null) => void, t: (key: string, params?: Record<string, string | number>) => string }} The catalog.
 *
 * @example
 * const i18n = createI18n({
 *   fallbackLocale: 'en',
 *   messages: {
 *     tr: { save: 'Kaydet', post_count: '{count} yazı' },
 *     en: { save: 'Save', post_count: '{count} post|{count} posts' },
 *   },
 * });
 * i18n.t('post_count', { count: 5 }); // "5 yazı"
 */
export function createI18n({ locale, fallbackLocale, messages }?: {
    locale?: string | null;
    fallbackLocale?: string;
    messages?: Record<string, Record<string, string>>;
}): {
    readonly locale: string;
    readonly fallbackLocale: string;
    setLocale: (locale: string | null) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
};
