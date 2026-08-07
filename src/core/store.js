/**
 * @module core/store
 * Shared cross-component state (ADR-0011). A store is a reactive object plus a subscription
 * list — deliberately tiny: no actions, no getters, no devtools (YAGNI). The set/update/persist
 * helpers are compact conveniences; the core size budget (constitution §9) caps how much
 * ergonomics fits in this module.
 */

import { createReactive } from './reactive.js';

/** Path segments rejected by set/update/persist to prevent prototype pollution (§8). */
const UNSAFE_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

/** @type {Set<object>} Every store created in this realm — powers the dev-only debug hook. */
const storeRegistry = new Set();

/**
 * Returns every store created via createStore() in this realm. Introspection hook for dev
 * tooling (core/debug.js); it is not re-exported from the size-gated `core/core.js` barrel.
 *
 * @returns {object[]} Created stores.
 */
export function getStores() {
  return [...storeRegistry];
}



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
export function createStore(initialState = {}) {
  /** @type {Set<(path: string) => void>} */
  const listeners = new Set();

  const state = createReactive(initialState, (path) => {
    for (const fn of [...listeners]) fn(path);
  });

  const store = {
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

    /**
     * Sets one top-level key; prototype-polluting keys are rejected with a warning (§8).
     *
     * @param {string} key - Top-level state key, e.g. `'count'`.
     * @param {*} value - Value to assign.
     * @returns {void}
     */
    set(key, value) {
      if (UNSAFE_KEYS.has(key)) {
        console.warn(`[devinim] store.set: invalid key "${key}".`);
        return;
      }
      state[key] = value;
    },

    /**
     * Applies a recipe to the state. The recipe may mutate `state` directly; when it returns a
     * plain object, its top-level entries are assigned onto the state — supporting the
     * `store.update((s) => ({ count: s.count + 1 }))` style.
     *
     * @param {(state: object) => (object | undefined)} recipe - Mutator or partial producer.
     * @returns {object} The reactive state (for chaining).
     */
    update(recipe) {
      const partial = recipe(state);
      if (partial && typeof partial === 'object') {
        for (const [key, value] of Object.entries(partial)) {
          if (!UNSAFE_KEYS.has(key)) state[key] = value;
        }
      }
      return state;
    },

    /**
     * Syncs the whole store to Web Storage under `key`: hydrates once on call (saved entries
     * override the initial state), then writes on every subsequent change. Serialization
     * failures warn instead of throwing so a full quota never breaks the app.
     *
     * @param {string} key - Storage key, e.g. `'my-shop-cart'`.
     * @param {{ storage?: Storage | null }} [options] - Storage driver (default: localStorage).
     * @returns {() => void} Dispose function: stops the write-through subscription.
     */
    persist(key, { storage } = {}) {
      if (storage === undefined) {
        try {
          storage = globalThis.localStorage ?? null;
        } catch {
          storage = null;
        }
      }
      if (!storage) {
        console.warn(`[devinim] store.persist("${key}"): no Web Storage available.`);
        return () => {};
      }
      try {
        store.update(() => JSON.parse(storage.getItem(key) ?? 'null'));
      } catch (error) {
        console.warn(`[devinim] store.persist("${key}"): hydration failed.`, error);
      }
      return store.subscribe(() => {
        try {
          storage.setItem(key, JSON.stringify(state));
        } catch (error) {
          console.warn(`[devinim] store.persist("${key}"): write failed.`, error);
        }
      });
    },
  };

  storeRegistry.add(store);
  return store;
}
