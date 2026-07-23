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
export function safeUrl(value: any, { allow }?: {
    allow?: string[];
}): string;
