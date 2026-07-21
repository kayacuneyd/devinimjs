/**
 * @module core/router
 * Dependency-free hash router for small build-free applications. Routing intentionally resolves
 * data only; components decide how and where a matched route is rendered.
 */

/**
 * @param {Window} [host] - Browser window; injectable for tests or embedded contexts.
 * @returns {{ add: (pattern: string, target: *) => object, start: () => () => void, stop: () => void, navigate: (path: string) => void, subscribe: (fn: (route: { path: string, params: Record<string, string>, target: * } | null) => void) => () => void, current: () => { path: string, params: Record<string, string>, target: * } | null }} Hash router.
 */
export function createHashRouter(host = globalThis.window) {
  const routes = [];
  const listeners = new Set();
  let started = false;
  let currentRoute = null;

  const dispatch = () => {
    const path = currentPath(host);
    currentRoute = matchRoute(routes, path);
    for (const listener of [...listeners]) listener(currentRoute);
  };

  return {
    add(pattern, target) {
      const route = { pattern, target, ...compilePattern(pattern) };
      routes.push(route);
      return this;
    },
    start() {
      if (!started) {
        host.addEventListener('hashchange', dispatch);
        started = true;
      }
      dispatch();
      return () => this.stop();
    },
    stop() {
      if (!started) return;
      host.removeEventListener('hashchange', dispatch);
      started = false;
    },
    navigate(path) {
      const next = normalizePath(path);
      if (currentPath(host) === next) {
        dispatch();
        return;
      }
      host.location.hash = next;
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    current() {
      return currentRoute;
    },
  };
}

/**
 * @param {Window} host - Router host.
 * @returns {string} Normalized current hash path.
 */
function currentPath(host) {
  return normalizePath(host.location.hash.replace(/^#/, ''));
}

/**
 * @param {string} path - Candidate path.
 * @returns {string} Hash-router path.
 */
function normalizePath(path) {
  const clean = String(path || '/').replace(/^#/, '');
  return clean.startsWith('/') ? clean : `/${clean}`;
}

/**
 * @param {string} pattern - Route pattern.
 * @returns {{ regex: RegExp, keys: string[] }} Compiled matcher.
 */
function compilePattern(pattern) {
  const keys = [];
  const escaped = normalizePath(pattern).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const source = escaped.replace(/:([A-Za-z][\w-]*)/g, (_whole, key) => {
    keys.push(key);
    return '([^/]+)';
  });
  return { regex: new RegExp(`^${source}/?$`), keys };
}

/**
 * @param {Array<{ regex: RegExp, keys: string[], target: * }>} routes - Registered routes.
 * @param {string} path - Requested path.
 * @returns {{ path: string, params: Record<string, string>, target: * } | null} Matched route.
 */
function matchRoute(routes, path) {
  for (const route of routes) {
    const match = route.regex.exec(path);
    if (!match) continue;
    const params = Object.fromEntries(route.keys.map((key, i) => [key, decodeURIComponent(match[i + 1])]));
    return { path, params, target: route.target };
  }
  return null;
}
