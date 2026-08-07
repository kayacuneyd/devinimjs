/**
 * @module core/debug
 * Dev-only introspection (ADR-0026): `installDebug()` exposes `window.__DEVINIM_DEBUG__` with
 * the registered element tags, the live component tree (with state snapshots) and every
 * created store. This module is deliberately absent from the size-gated `core/core.js` barrel
 * (ADR-0019 precedent) — import it explicitly in development:
 *
 * @example
 * import { installDebug } from './core/debug.js';
 * if (location.hostname === 'localhost') installDebug();
 * // console: __DEVINIM_DEBUG__.components() → [{ tag: 'dv-counter', state: { count: 3 } }]
 */

import { getLiveComponents } from './base-component.js';
import { getDefinedTags } from './registry.js';
import { getStores } from './store.js';

/**
 * @param {*} value - Candidate state.
 * @returns {*} A JSON round-tripped copy, or a placeholder when serialization fails.
 */
function snapshot(value) {
  try {
    return JSON.parse(JSON.stringify(value ?? null));
  } catch {
    return '[unserializable]';
  }
}

/**
 * Installs the global debug handle and returns it.
 *
 * @param {object} [host] - Global object to attach to (default: `globalThis`).
 * @returns {{ tags: () => string[], components: () => Array<{ tag: string, state: * }>, stores: () => Array<*> }} The `__DEVINIM_DEBUG__` API:
 *   `tags()` lists every define()d element; `components()` snapshots each connected
 *   component's tag and reactive state; `stores()` snapshots every createStore() state.
 */
export function installDebug(host = globalThis) {
  const api = {
    tags: () => getDefinedTags(),
    components: () => getLiveComponents().map((el) => ({
      tag: el.nodeName.toLowerCase(),
      state: snapshot(el.state),
    })),
    stores: () => getStores().map((store) => snapshot(store.state)),
  };
  host.__DEVINIM_DEBUG__ = api;
  return api;
}
