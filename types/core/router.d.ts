/**
 * Hash router. Patterns support `:param` segments and one trailing wildcard
 * (`'/admin/*'` → `params.wildcard`; register it last as a not-found catch-all). A route
 * target is an opaque value — except plain functions, which are treated as lazy loaders:
 * called on first match, their (awaited) result — or its `.default` export — becomes the
 * target and is cached. Class constructors are never called: `mount()` resolves them through
 * the element registry.
 *
 * Guards (`beforeEach`, per-route `beforeEnter`) receive the matched route and may be async.
 * Verdicts: `false` blocks navigation (the current route stays), a string redirects,
 * anything else proceeds.
 *
 * @param {Window} [host] - Browser window; injectable for tests or embedded contexts.
 * @returns {{
 *   add: (pattern: string, target: *, options?: { beforeEnter?: (route: object) => * }) => object,
 *   beforeEach: (guard: (route: object) => *) => object,
 *   mount: (mountHost: Element | string, routeMap?: Record<string, *>) => () => void,
 *   start: () => () => void,
 *   stop: () => void,
 *   navigate: (path: string) => void,
 *   subscribe: (fn: (route: { path: string, params: Record<string, string>, target: * } | null) => void) => () => void,
 *   current: () => { path: string, params: Record<string, string>, target: * } | null,
 * }} Hash router.
 */
export function createHashRouter(host?: Window): {
    add: (pattern: string, target: any, options?: {
        beforeEnter?: (route: object) => any;
    }) => object;
    beforeEach: (guard: (route: object) => any) => object;
    mount: (mountHost: Element | string, routeMap?: Record<string, any>) => () => void;
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
/**
 * Intercepts clicks on `<a dv-link>` anchors and routes them through the hash router —
 * declarative SPA navigation (`<a dv-link="/about">Hakkında</a>`). Plain left-clicks only;
 * modifier keys, and any `target` other than `_self`, opt out and keep native behavior.
 *
 * @param {ReturnType<typeof createHashRouter>} router - The router to navigate with.
 * @param {Document | Element} [root] - Delegation root (default: the document).
 * @returns {() => void} Unbind function.
 */
export function bindRouterLinks(router: ReturnType<typeof createHashRouter>, root?: Document | Element): () => void;
