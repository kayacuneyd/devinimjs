/**
 * Patches `host` so its children match the given template output.
 *
 * @param {Element} host - The live element to patch (typically a component root).
 * @param {string} htmlString - Trusted template output (from HtmlString.toString()).
 * @returns {void}
 */
export function morph(host: Element, htmlString: string): void;
