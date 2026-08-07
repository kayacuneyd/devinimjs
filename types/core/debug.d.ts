/**
 * Installs the global debug handle and returns it.
 *
 * @param {object} [host] - Global object to attach to (default: `globalThis`).
 * @returns {{ tags: () => string[], components: () => Array<{ tag: string, state: * }>, stores: () => Array<*> }} The `__DEVINIM_DEBUG__` API:
 *   `tags()` lists every define()d element; `components()` snapshots each connected
 *   component's tag and reactive state; `stores()` snapshots every createStore() state.
 */
export function installDebug(host?: object): {
    tags: () => string[];
    components: () => Array<{
        tag: string;
        state: any;
    }>;
    stores: () => Array<any>;
};
