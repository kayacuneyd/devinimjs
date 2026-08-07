/**
 * Reverse lookup used by the router's `mount()` (ADR-0023): finds the tag a define()d
 * constructor was registered under.
 *
 * @param {CustomElementConstructor} ctor - A constructor previously passed to define().
 * @returns {string | null} The registered tag, or null.
 */
export function getRegisteredTag(ctor: CustomElementConstructor): string | null;
/**
 * Snapshot of every tag registered through define(). Introspection hook for dev tooling
 * (core/debug.js); not re-exported from the size-gated `core/core.js` barrel.
 *
 * @returns {string[]} Registered tag names.
 */
export function getDefinedTags(): string[];
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
export function define(tagName: string, ctor: CustomElementConstructor): CustomElementConstructor;
