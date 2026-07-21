/**
 * @module core/html
 * The `html` tagged template — DevinimJS's only template mechanism (ADR-0002), and the
 * escape-by-default XSS boundary (ADR-0003). Pure string processing: no DOM required.
 */

/** Entity map for the five characters that must never survive interpolation raw. */
const ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapes HTML-significant characters in a value.
 *
 * @param {*} value - Value to escape (coerced with String()).
 * @returns {string} The escaped string, safe for text and double-quoted attribute contexts.
 */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

/**
 * Opaque, trusted HTML string. Only the `html` tag and `unsafe()` create instances; the tag
 * passes instances through interpolations unescaped, which guarantees escaping happens exactly
 * once at template creation (ADR-0003).
 */
export class HtmlString {
  /** @type {string} */
  #value;

  /**
   * @param {*} value - Trusted HTML source.
   */
  constructor(value) {
    this.#value = String(value);
  }

  /**
   * @returns {string} The raw, trusted HTML.
   */
  toString() {
    return this.#value;
  }
}

/**
 * Renders one interpolated value according to the ADR-0002 rules:
 * HtmlString → as-is · Array → item-wise join · null/undefined/false → '' · else → escaped.
 *
 * @param {*} value - The interpolated value.
 * @returns {string} Safe HTML fragment.
 */
function renderValue(value) {
  if (value === null || value === undefined || value === false) return '';
  if (value instanceof HtmlString) return value.toString();
  if (Array.isArray(value)) return value.map(renderValue).join('');
  return escapeHtml(value);
}

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
export function html(strings, ...values) {
  const chunks = [...strings]; // TemplateStringsArray is frozen — work on a copy.
  let out = chunks[0];

  for (let i = 0; i < values.length; i++) {
    const next = chunks[i + 1];
    const value = values[i];
    const soleAttr = /([a-zA-Z_:][\w:.-]*)="$/.exec(out);

    if (
      soleAttr &&
      next.startsWith('"') &&
      (value === true || value === false || value === null || value === undefined)
    ) {
      // Sole-value attribute position with a boolean-ish value (ADR-0002 #5).
      out = out.slice(0, out.length - soleAttr[0].length); // drop the `attr="` just appended
      const remainder = next.slice(1); // drop the closing `"`
      if (value === true) {
        out += soleAttr[1] + remainder; // `out` already ends with the separating space
      } else {
        if (out.endsWith(' ')) out = out.slice(0, -1); // swallow the orphaned space
        out += remainder;
      }
      continue;
    }

    out += renderValue(value) + next;
  }

  return new HtmlString(out);
}

/**
 * Marks raw HTML as trusted. **Escape hatch for exceptional cases only** — every usage requires
 * a security-review note (ADR-0003, CONTRIBUTING.md). Never wrap user-controlled input.
 *
 * @param {string} rawHtml - HTML you have sanitized/verified yourself.
 * @returns {HtmlString} Trusted HTML that bypasses escaping.
 */
export function unsafe(rawHtml) {
  return new HtmlString(rawHtml);
}
