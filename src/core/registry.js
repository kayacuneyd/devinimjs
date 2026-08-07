/**
 * @module core/registry
 * Guarded custom-element registration (ADR-0006). The tag string is always explicit so every
 * registration is greppable — a hard requirement for predictable component authoring.
 */

/** @type {Map<string, CustomElementConstructor>} Tag → constructor registry (ADR-0006). */
const definedElements = new Map();

/**
 * Reverse lookup used by the router's `mount()` (ADR-0023): finds the tag a define()d
 * constructor was registered under.
 *
 * @param {CustomElementConstructor} ctor - A constructor previously passed to define().
 * @returns {string | null} The registered tag, or null.
 */
export function getRegisteredTag(ctor) {
  for (const [tag, candidate] of definedElements) {
    if (candidate === ctor) return tag;
  }
  return null;
}

/**
 * Snapshot of every tag registered through define(). Introspection hook for dev tooling
 * (core/debug.js); not re-exported from the size-gated `core/core.js` barrel.
 *
 * @returns {string[]} Registered tag names.
 */
export function getDefinedTags() {
  return [...definedElements.keys()];
}

/**
 * Registers a custom element with safety guards.
 *
 * @param {string} tagName - Explicit tag name; must contain a hyphen (e.g. `'dv-counter'`).
 * @param {CustomElementConstructor} ctor - The element class.
 * @returns {CustomElementConstructor} The registered (or already-registered) constructor.
 * @throws {Error} When the tag name is invalid.
 *
 * @example
 * define('dv-counter', DvCounter);
 */
export function define(tagName, ctor) {
  if (typeof tagName !== 'string' || !tagName.includes('-')) {
    throw new Error(
      `[devinim] Invalid custom element name "${tagName}" — it must contain a hyphen (ADR-0006).`,
    );
  }
  const existing = customElements.get(tagName);
  if (existing) {
    console.warn(`[devinim] "${tagName}" is already defined; skipping re-registration.`);
    definedElements.set(tagName, existing);
    return existing;
  }
  customElements.define(tagName, ctor);
  definedElements.set(tagName, ctor);
  return ctor;
}
