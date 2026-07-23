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
export function createStore(initialState?: object): {
    state: object;
    subscribe: (fn: (path: string) => void) => () => void;
};
