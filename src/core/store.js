/**
 * @module core/store
 * Shared cross-component state (ADR-0011). A store is a reactive object plus a subscription
 * list — deliberately tiny: no actions, no getters, no devtools (YAGNI).
 */

import { createReactive } from './reactive.js';

/**
 * Creates a shared store. Keep one instance per domain in a module and import it wherever
 * needed; components wire re-rendering with `this.useStore(store)`.
 *
 * @param {object} initialState - Initial shared state (default: empty object).
 * @returns {{ state: object, subscribe: (fn: (path: string) => void) => () => void }} The store:
 *   `state` is the reactive proxy; `subscribe(fn)` registers a listener and returns an
 *   unsubscribe function.
 *
 * @example
 * // store/cart.js
 * import { createStore } from '../core/core.js';
 * export const cartStore = createStore({ items: [], coupon: null });
 *
 * // inside any component:
 * connected() { this.useStore(cartStore); }
 * template() { return html`<p>${cartStore.state.items.length} items</p>`; }
 */
export function createStore(initialState = {}) {
  /** @type {Set<(path: string) => void>} */
  const listeners = new Set();

  const state = createReactive(initialState, (path) => {
    for (const fn of [...listeners]) fn(path);
  });

  return {
    state,
    /**
     * Registers a change listener.
     *
     * @param {(path: string) => void} fn - Called with the changed dot path after any mutation.
     * @returns {() => void} Unsubscribe function.
     */
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
