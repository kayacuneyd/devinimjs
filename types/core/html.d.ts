/**
 * Escapes HTML-significant characters in a value.
 *
 * @param {*} value - Value to escape (coerced with String()).
 * @returns {string} The escaped string, safe for text and double-quoted attribute contexts.
 */
export function escapeHtml(value: any): string;
/**
 * Tagged template for component templates. Interpolations are escaped by default; control flow
 * is plain JavaScript (`.map()`, ternaries, `&&`).
 *
 * Boolean attribute rule (ADR-0002 #5): when an interpolation is the *entire* attribute value
 * (`disabled="${x}"`) and the value is `true`, the bare attribute is emitted; for
 * `false | null | undefined` the attribute is omitted entirely.
 *
 * @param {TemplateStringsArray} strings - Static template chunks.
 * @param {...*} values - Interpolated values.
 * @returns {HtmlString} Trusted HTML, ready for the morph renderer.
 *
 * @example
 * template() {
 *   return html`
 *     <ul>${this.state.users.map((u) => html`<li>${u.name}</li>`)}</ul>
 *     <button disabled="${this.state.saving}">Save</button>
 *   `;
 * }
 */
export function html(strings: TemplateStringsArray, ...values: any[]): HtmlString;
/**
 * Marks raw HTML as trusted. **Escape hatch for exceptional cases only** — every usage requires
 * a security-review note (ADR-0003, CONTRIBUTING.md). Never wrap user-controlled input.
 *
 * @param {string} rawHtml - HTML you have sanitized/verified yourself.
 * @returns {HtmlString} Trusted HTML that bypasses escaping.
 */
export function unsafe(rawHtml: string): HtmlString;
/**
 * Opaque, trusted HTML string. Only the `html` tag and `unsafe()` create instances; the tag
 * passes instances through interpolations unescaped, which guarantees escaping happens exactly
 * once at template creation (ADR-0003).
 */
export class HtmlString {
    /**
     * @param {*} value - Trusted HTML source.
     */
    constructor(value: any);
    /**
     * @returns {string} The raw, trusted HTML.
     */
    toString(): string;
    #private;
}
