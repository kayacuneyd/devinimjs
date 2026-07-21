/**
 * @module core/morph
 * Positional DOM morphing (ADR-0001/0002). Patches an existing DOM subtree in place so it
 * matches a freshly rendered template string — preserving focus, selection and any nodes that
 * did not change, instead of blowing the subtree away with innerHTML.
 *
 * Invariants that make positional morphing safe here:
 * - Both sides of a diff always come from `html` templates → whitespace is deterministic,
 *   so whitespace-only text nodes are never trimmed (ADR-0002 #6) and `<pre>` stays correct.
 * - `<dv-outlet>` elements are synced but never recursed into (ADR-0009): their subtree belongs
 *   to the consumer, not to `template()`.
 */

/** Tag name of the composition outlet element (uppercase, as reported by the DOM). */
const OUTLET_TAG = 'DV-OUTLET';

/**
 * Patches `host` so its children match the given template output.
 *
 * @param {Element} host - The live element to patch (typically a component root).
 * @param {string} htmlString - Trusted template output (from HtmlString.toString()).
 * @returns {void}
 */
export function morph(host, htmlString) {
  const tpl = document.createElement('template');
  tpl.innerHTML = htmlString;
  morphChildren(host, tpl.content);
}

/**
 * Aligns the child nodes of `oldParent` with those of `newParent`, positionally.
 * Extra new nodes are moved (not cloned) out of the template fragment; extra old nodes are
 * removed.
 *
 * @param {Node} oldParent - Live parent whose children are patched.
 * @param {Node} newParent - Template parent holding the desired children.
 * @returns {void}
 */
function morphChildren(oldParent, newParent) {
  const oldNodes = Array.from(oldParent.childNodes);
  const newNodes = Array.from(newParent.childNodes);
  const common = Math.min(oldNodes.length, newNodes.length);

  for (let i = 0; i < common; i++) morphNode(oldNodes[i], newNodes[i]);
  for (let i = common; i < newNodes.length; i++) oldParent.appendChild(newNodes[i]);
  for (let i = common; i < oldNodes.length; i++) oldNodes[i].remove();
}

/**
 * Patches a single node pair. Nodes of different type/name are replaced outright; text-like
 * nodes update in place; elements sync attributes and recurse (except `<dv-outlet>`).
 *
 * @param {Node} oldNode - Live node.
 * @param {Node} newNode - Desired node from the template fragment.
 * @returns {void}
 */
function morphNode(oldNode, newNode) {
  if (oldNode.nodeType !== newNode.nodeType || oldNode.nodeName !== newNode.nodeName) {
    oldNode.replaceWith(newNode); // moves the node out of the template fragment
    return;
  }

  if (oldNode.nodeType === Node.TEXT_NODE || oldNode.nodeType === Node.COMMENT_NODE) {
    if (oldNode.nodeValue !== newNode.nodeValue) oldNode.nodeValue = newNode.nodeValue;
    return;
  }

  // Element node. The outlet's subtree is consumer-owned (ADR-0009) — do not touch it.
  if (oldNode.nodeName === OUTLET_TAG) return;

  syncAttributes(/** @type {Element} */ (oldNode), /** @type {Element} */ (newNode));
  morphChildren(oldNode, newNode);
}

/**
 * Syncs the attribute lists of two elements: removes what the template dropped, sets what
 * changed. Unchanged attributes are never touched (keeps `value` on the focused input stable).
 *
 * @param {Element} oldEl - Live element.
 * @param {Element} newEl - Desired element from the template fragment.
 * @returns {void}
 */
function syncAttributes(oldEl, newEl) {
  for (const attr of Array.from(oldEl.attributes)) {
    if (!newEl.hasAttribute(attr.name)) oldEl.removeAttribute(attr.name);
  }
  for (const attr of Array.from(newEl.attributes)) {
    if (oldEl.getAttribute(attr.name) !== attr.value) oldEl.setAttribute(attr.name, attr.value);
  }
}
