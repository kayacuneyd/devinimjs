/**
 * @module core/morph
 * DOM morphing (ADR-0001/0002/0014). Patches an existing DOM subtree in place so it matches a
 * freshly rendered template string — preserving focus, selection and any nodes that did not
 * change, instead of blowing the subtree away with innerHTML.
 *
 * Invariants that make positional morphing safe here:
 * - Both sides of a diff always come from `html` templates → whitespace is deterministic,
 *   so whitespace-only text nodes are never trimmed (ADR-0002 #6) and `<pre>` stays correct.
 * - Sibling lists whose elements all declare `data-key` are matched by key; all other ranges use
 *   the small positional algorithm (ADR-0014).
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
  if (canMorphKeyedChildren(oldParent, newParent)) {
    morphKeyedChildren(oldParent, newParent);
    return;
  }

  const oldNodes = Array.from(oldParent.childNodes);
  const newNodes = Array.from(newParent.childNodes);
  const common = Math.min(oldNodes.length, newNodes.length);

  for (let i = 0; i < common; i++) morphNode(oldNodes[i], newNodes[i]);
  for (let i = common; i < newNodes.length; i++) oldParent.appendChild(newNodes[i]);
  for (let i = common; i < oldNodes.length; i++) oldNodes[i].remove();
}

/**
 * Returns whether a sibling range opts into keyed matching. Whitespace/comments may appear
 * between list items; every *element* sibling must carry `data-key` on both sides.
 *
 * @param {Node} oldParent - Live parent whose children are patched.
 * @param {Node} newParent - Template parent holding the desired children.
 * @returns {boolean} True when the range can be matched by key.
 */
function canMorphKeyedChildren(oldParent, newParent) {
  const oldElements = childElements(oldParent);
  const newElements = childElements(newParent);
  if (oldElements.length === 0 || newElements.length === 0) return false;
  if (!oldElements.every((el) => el.hasAttribute('data-key'))) return false;
  if (!newElements.every((el) => el.hasAttribute('data-key'))) return false;

  return hasUniqueKeys(oldElements, 'existing') && hasUniqueKeys(newElements, 'next');
}

/**
 * Matches keyed element siblings by `data-key`, moving existing nodes into their new order so
 * DOM-local state (focus, selection, nested custom elements) stays with its logical item.
 * Non-element nodes such as formatting whitespace are refreshed from the template.
 *
 * @param {Node} oldParent - Live parent whose children are patched.
 * @param {Node} newParent - Template parent holding the desired children.
 * @returns {void}
 */
function morphKeyedChildren(oldParent, newParent) {
  const oldByKey = new Map(childElements(oldParent).map((el) => [el.getAttribute('data-key'), el]));
  let reference = oldParent.firstChild;

  for (const newNode of Array.from(newParent.childNodes)) {
    let liveNode = newNode;
    if (newNode.nodeType === Node.ELEMENT_NODE && newNode.hasAttribute('data-key')) {
      const key = newNode.getAttribute('data-key');
      const existing = oldByKey.get(key);
      if (existing) {
        morphNode(existing, newNode);
        liveNode = existing;
        oldByKey.delete(key);
      }
    }

    if (liveNode !== reference) oldParent.insertBefore(liveNode, reference);
    reference = liveNode.nextSibling;
  }

  while (reference) {
    const next = reference.nextSibling;
    reference.remove();
    reference = next;
  }
}

/**
 * @param {Node} parent - Parent whose direct element children are needed.
 * @returns {Element[]} Direct element children.
 */
function childElements(parent) {
  return Array.from(parent.childNodes).filter((node) => node.nodeType === Node.ELEMENT_NODE);
}

/**
 * Validates the keyed-morph contract and warns before safely falling back to positional morph.
 *
 * @param {Element[]} elements - Direct keyed siblings.
 * @param {string} side - Diagnostic label for the live or desired sibling set.
 * @returns {boolean} True when every key is present and unique.
 */
function hasUniqueKeys(elements, side) {
  const keys = new Set();
  for (const el of elements) {
    const key = el.getAttribute('data-key');
    if (key === null || keys.has(key)) {
      console.warn(`[devinim] keyed morph skipped: duplicate or missing data-key in ${side} siblings.`);
      return false;
    }
    keys.add(key);
  }
  return true;
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

  syncFormControl(/** @type {Element} */ (oldNode), /** @type {Element} */ (newNode));
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

/**
 * Synchronizes live form-control properties only when their template value changed. Leaving
 * unchanged attributes untouched preserves a user's in-progress text, selection and focus when
 * an unrelated state change re-renders the component.
 *
 * @param {Element} oldEl - Live form control.
 * @param {Element} newEl - Desired form control.
 * @returns {void}
 */
function syncFormControl(oldEl, newEl) {
  if (oldEl.nodeName === 'INPUT') {
    const type = oldEl.getAttribute('type') ?? 'text';
    if (type !== 'checkbox' && type !== 'radio' && oldEl.getAttribute('value') !== newEl.getAttribute('value')) {
      oldEl.value = newEl.getAttribute('value') ?? '';
    }
    if ((type === 'checkbox' || type === 'radio') && oldEl.hasAttribute('checked') !== newEl.hasAttribute('checked')) {
      oldEl.checked = newEl.hasAttribute('checked');
    }
    return;
  }

  if (oldEl.nodeName === 'TEXTAREA' && oldEl.textContent !== newEl.textContent) {
    oldEl.value = newEl.textContent;
    return;
  }

  if (oldEl.nodeName === 'OPTION' && oldEl.hasAttribute('selected') !== newEl.hasAttribute('selected')) {
    oldEl.selected = newEl.hasAttribute('selected');
  }
}
