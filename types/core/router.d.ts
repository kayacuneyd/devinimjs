/**
 * @module core/router
 * Dependency-free hash router for small build-free applications. Routing intentionally resolves
 * data only; components decide how and where a matched route is rendered.
 */
/**
 * @param {Window} [host] - Browser window; injectable for tests or embedded contexts.
 * @returns {{ add: (pattern: string, target: *) => object, start: () => () => void, stop: () => void, navigate: (path: string) => void, subscribe: (fn: (route: { path: string, params: Record<string, string>, target: * } | null) => void) => () => void, current: () => { path: string, params: Record<string, string>, target: * } | null }} Hash router.
 */
export function createHashRouter(host?: Window): {
    add: (pattern: string, target: any) => object;
    start: () => () => void;
    stop: () => void;
    navigate: (path: string) => void;
    subscribe: (fn: (route: {
        path: string;
        params: Record<string, string>;
        target: any;
    } | null) => void) => () => void;
    current: () => {
        path: string;
        params: Record<string, string>;
        target: any;
    } | null;
};
