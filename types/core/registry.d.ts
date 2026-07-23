/**
 * @module core/registry
 * Guarded custom-element registration (ADR-0006). The tag string is always explicit so every
 * registration is greppable — a hard requirement for predictable component authoring.
 */
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
