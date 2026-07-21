/**
 * @module core
 * DevinimJS public API barrel. Import everything a component author needs from here:
 *
 * @example
 * import { BaseComponent, html, define } from '../core/core.js';
 */
export { BaseComponent } from './base-component.js';
export { createReactive } from './reactive.js';
export { createStore } from './store.js';
export { html, unsafe, HtmlString, escapeHtml } from './html.js';
export { morph } from './morph.js';
export { define } from './registry.js';
export { safeUrl } from './utils.js';
