/**
 * @module core/utils
 * Small, dependency-free utilities. Currently home to the URL hygiene helper mandated by
 * ADR-0003 #5.
 */

/** Protocols allowed through `safeUrl` by default. */
const DEFAULT_ALLOWED = ['http:', 'https:', 'mailto:', 'tel:'];

/**
 * Sanitizes a URL for use in `href`/`src` interpolations. Allows http(s), mailto, tel and
 * relative paths; anything else (e.g. `javascript:`) degrades to `'#'`.
 *
 * ADR-0003: user-controlled URLs may only reach attributes through this helper. It is mandatory
 * in framework-owned components.
 *
 * @param {*} value - Candidate URL (any type; coerced and trimmed).
 * @param {{ allow?: string[] }} [options] - Override the allowed protocol list.
 * @returns {string} A safe URL, or `'#'` when the input is not acceptable.
 *
 * @example
 * html`<a href="${safeUrl(this.state.profileUrl)}">Profile</a>`
 */
export function safeUrl(value, { allow = DEFAULT_ALLOWED } = {}) {
  const raw = String(value ?? '').trim();
  if (raw === '') return '#';
  if (raw.startsWith('/') || raw.startsWith('#') || raw.startsWith('./') || raw.startsWith('../')) {
    return raw;
  }
  try {
    // Base URL lets scheme-less relatives ("page.php", "//cdn…") parse with an allowed protocol.
    const url = new URL(raw, 'https://devinim.invalid');
    return allow.includes(url.protocol) ? raw : '#';
  } catch {
    return '#';
  }
}
