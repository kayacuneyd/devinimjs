/**
 * @module core/async-state
 * Small async state machine for fetches, uploads and any promise-backed UI work. It is a store,
 * so components can subscribe with `this.useStore(resource)` without a framework dependency.
 */

import { createStore } from './store.js';

/**
 * Creates a stale-safe async resource. A newer `run()` call always wins over an older request
 * that settles later.
 *
 * @template T
 * @param {T | null} [initialData] - Initial successful data, when available.
 * @returns {{ state: { status: 'idle' | 'loading' | 'success' | 'error', data: T | null, error: unknown }, subscribe: (fn: (path: string) => void) => () => void, run: (task: (() => Promise<T>) | Promise<T>) => Promise<T>, reset: () => void }} Async resource.
 */
export function createAsyncState(initialData = null) {
  const store = createStore({
    status: initialData === null ? 'idle' : 'success',
    data: initialData,
    error: null,
  });
  let requestId = 0;

  return {
    ...store,
    async run(task) {
      const id = ++requestId;
      store.state.status = 'loading';
      store.state.error = null;
      try {
        const value = await (typeof task === 'function' ? task() : task);
        if (id === requestId) {
          store.state.data = value;
          store.state.status = 'success';
        }
        return value;
      } catch (error) {
        if (id === requestId) {
          store.state.error = error;
          store.state.status = 'error';
        }
        throw error;
      }
    },
    reset() {
      requestId++;
      store.state.status = initialData === null ? 'idle' : 'success';
      store.state.data = initialData;
      store.state.error = null;
    },
  };
}
