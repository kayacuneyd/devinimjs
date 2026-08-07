/**
 * Returns every store created via createStore() in this realm. Introspection hook for dev
 * tooling (core/debug.js); it is not re-exported from the size-gated `core/core.js` barrel.
 *
 * @returns {object[]} Created stores.
 */
export function getStores(): object[];
/**
 * Creates a shared store. Keep one instance per domain in a module and import it wherever
 * needed; components wire re-rendering with `this.useStore(store)`.
 *
 * @param {object} initialState - Initial shared state (default: empty object).
 * @returns {{ state: object, subscribe: (fn: (path: string) => void) => () => void, set: (key: string, value: *) => void, update: (recipe: (state: object) => (object | undefined)) => object, persist: (key: string, options?: { storage?: Storage | null }) => () => void }} The store:
 *   `state` is the reactive proxy; `subscribe(fn)` registers a listener and returns an
 *   unsubscribe function. `set`/`update` are ergonomic mutation helpers; `persist` syncs the
 *   whole store to Web Storage (ADR-0011 amendment).
 *
 * @example
 * // store/cart.js
 * import { createStore } from '../core/core.js';
 * export const cartStore = createStore({ items: [], coupon: null });
 * cartStore.persist('my-shop-cart');
 *
 * // inside any component:
 * connected() { this.useStore(cartStore); }
 * template() { return html`<p>${cartStore.state.items.length} items</p>`; }
 */
export function createStore(initialState?: object): {
    state: object;
    subscribe: (fn: (path: string) => void) => () => void;
    set: (key: string, value: any) => void;
    update: (recipe: (state: object) => (object | undefined)) => object;
    persist: (key: string, options?: {
        storage?: Storage | null;
    }) => () => void;
};
