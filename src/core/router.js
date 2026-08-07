/**
 * @module core/router
 * Dependency-free hash router for small build-free applications (ADR-0012, amended by
 * ADR-0023): parameterized patterns, a trailing wildcard, sync/async route guards and lazy
 * (dynamic-import) targets. The router still only resolves *which* route matched — components
 * own rendering; `mount()` is the thin convenience that instantiates the matched element.
 */

import { getRegisteredTag } from './registry.js';

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
export function createHashRouter(host = globalThis.window) {
  const routes = [];
  const listeners = new Set();
  const globalGuards = [];
  let started = false;
  let currentRoute = null;
  let navToken = 0;

  const notify = (route) => {
    currentRoute = route;
    for (const listener of [...listeners]) listener(route);
  };

  /**
   * Runs guards and lazy resolution, then notifies — unless a newer navigation superseded
   * this one (token check after every await).
   *
   * @param {{ route: object, params: Record<string, string> }} matched - The matched route record.
   * @param {string} path - The normalized current hash path.
   * @param {number} token - Navigation sequence id for staleness checks.
   * @param {Array<(route: object) => *>} guards - Global guards plus the route's beforeEnter.
   * @returns {Promise<void>}
   */
  const resolveAndNotify = async (matched, path, token, guards) => {
    const route = { path, params: matched.params, target: matched.route.target };
    try {
      for (const guard of guards) {
        const verdict = await guard(route);
        if (token !== navToken) return;
        if (verdict === false) return;
        if (typeof verdict === 'string') {
          api.navigate(verdict);
          return;
        }
      }
      if (isLazyTarget(matched.route.target) && matched.route.resolved === undefined) {
        const loaded = await matched.route.target(route);
        matched.route.resolved = loaded && typeof loaded === 'object' && 'default' in loaded
          ? loaded.default
          : loaded;
      }
      if (matched.route.resolved !== undefined) route.target = matched.route.resolved;
      if (token !== navToken) return;
      notify(route);
    } catch (error) {
      console.error(`[devinim] router: navigation to "${path}" failed.`, error);
    }
  };

  const dispatch = () => {
    const token = ++navToken;
    const path = currentPath(host);
    const matched = matchRoute(routes, path);
    if (!matched) {
      notify(null);
      return;
    }
    const guards = [...globalGuards, matched.route.beforeEnter].filter(Boolean);
    if (guards.length === 0 && !isLazyTarget(matched.route.target)) {
      // Fast path: plain routes dispatch synchronously (ADR-0012 behavior, unchanged).
      notify({ path, params: matched.params, target: matched.route.target });
      return;
    }
    resolveAndNotify(matched, path, token, guards);
  };


  const api = {
    /**
     * @param {string} pattern - `'/posts'`, `'/posts/:id'` or `'/admin/*'`.
     * @param {*} target - Route payload: tag string, define()d constructor, or lazy loader.
     * @param {{ beforeEnter?: (route: object) => * }} [options] - Per-route guard.
     * @returns {object} This router (chainable).
     */
    add(pattern, target, { beforeEnter } = {}) {
      routes.push({ pattern, target, beforeEnter, resolved: undefined, ...compilePattern(pattern) });
      return api;
    },

    /**
     * @param {(route: object) => *} guard - Global guard, runs before every matched route.
     * @returns {object} This router (chainable).
     */
    beforeEach(guard) {
      globalGuards.push(guard);
      return api;
    },

    /**
     * Renders matched routes into a container. The resolved target must be a custom-element
     * tag string or a define()d constructor; route params arrive as `data-param-*` attributes
     * (`/posts/:id` → `data-param-id`, read with `this.str('paramId')`). Same-tag navigations
     * update attributes in place; different tags replace the element; an unmatched hash clears
     * the container.
     *
     * @param {Element | string} mountHost - Container element or selector.
     * @param {Record<string, *>} [routeMap] - Optional `{ pattern: target }` shorthand, added
     *   in insertion order before mounting.
     * @returns {() => void} Dispose: unsubscribe and remove the rendered element.
     */
    mount(mountHost, routeMap) {
      const container = typeof mountHost === 'string'
        ? host.document.querySelector(mountHost)
        : mountHost;
      if (!container) throw new Error('[devinim] router.mount: host element not found.');
      if (routeMap) {
        for (const [pattern, target] of Object.entries(routeMap)) api.add(pattern, target);
      }
      let el = null;
      const unsubscribe = api.subscribe((route) => {
        if (!route) {
          if (el) el.remove();
          el = null;
          return;
        }
        const tag = resolveTag(route.target);
        if (!tag) {
          console.warn(
            '[devinim] router.mount: route target is not a registered element tag — use a tag string or a define()d constructor.',
          );
          return;
        }
        if (el && el.nodeName.toLowerCase() === tag) {
          syncRouteParams(el, route.params);
          return;
        }
        const next = host.document.createElement(tag);
        syncRouteParams(next, route.params);
        if (el) el.replaceWith(next);
        else container.replaceChildren(next);
        el = next;
      });
      return () => {
        unsubscribe();
        if (el) el.remove();
        el = null;
      };
    },

    start() {
      if (!started) {
        host.addEventListener('hashchange', dispatch);
        started = true;
      }
      dispatch();
      return () => api.stop();
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

  return api;
}

/**
 * Intercepts clicks on `<a dv-link>` anchors and routes them through the hash router —
 * declarative SPA navigation (`<a dv-link="/about">Hakkında</a>`). Plain left-clicks only;
 * modifier keys, and any `target` other than `_self`, opt out and keep native behavior.
 *
 * @param {ReturnType<typeof createHashRouter>} router - The router to navigate with.
 * @param {Document | Element} [root] - Delegation root (default: the document).
 * @returns {() => void} Unbind function.
 */
export function bindRouterLinks(router, root = globalThis.document) {
  const onClick = (event) => {
    if (event.defaultPrevented || event.button !== 0
      || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target?.closest?.('a[dv-link]');
    if (!anchor || (root.contains && !root.contains(anchor))) return;
    if (anchor.target && anchor.target !== '_self') return;
    const path = anchor.getAttribute('dv-link') || anchor.getAttribute('href');
    if (!path) return;
    event.preventDefault();
    router.navigate(path);
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}

/**
 * A plain-function target is a lazy loader; a class constructor is a resolved element target.
 *
 * @param {*} target - Route target.
 * @returns {boolean} True for lazy loaders.
 */
function isLazyTarget(target) {
  return typeof target === 'function'
    && !/^class\s/.test(Function.prototype.toString.call(target));
}

/**
 * Resolves a route target to a custom-element tag name for `mount()`: tag strings pass
 * through, define()d constructors reverse-lookup through the registry, ES-module namespaces
 * unwrap their default export.
 *
 * @param {*} target - Resolved route target.
 * @returns {string | null} The tag name, or null when not mountable.
 */
function resolveTag(target) {
  if (typeof target === 'string') return target;
  if (typeof target === 'function') return getRegisteredTag(target) ?? null;
  if (target && typeof target === 'object' && 'default' in target) return resolveTag(target.default);
  return null;
}

/**
 * Replaces the element's `data-param-*` attributes with the current route params (camelCase
 * keys become kebab-case). Stale params from a previous route are removed first.
 *
 * @param {Element} el - The mounted route element.
 * @param {Record<string, string>} params - Current route params.
 * @returns {void}
 */
function syncRouteParams(el, params) {
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith('data-param-')) el.removeAttribute(attr.name);
  }
  for (const [key, value] of Object.entries(params)) {
    const kebab = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    el.setAttribute(`data-param-${kebab}`, value);
  }
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
 * @param {string} pattern - Route pattern; supports `:param` segments and one trailing `*`.
 * @returns {{ regex: RegExp, keys: string[] }} Compiled matcher.
 */
function compilePattern(pattern) {
  const keys = [];
  const normalized = normalizePath(pattern);
  const wildcard = normalized === '/*' || normalized.endsWith('/*');
  const base = wildcard ? normalized.replace(/\/?\*$/, '') || '/' : normalized;
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const source = escaped.replace(/:([A-Za-z][\w-]*)/g, (_whole, key) => {
    keys.push(key);
    return '([^/]+)';
  });
  const tail = wildcard ? '(?:/(.*))?' : '';
  if (wildcard) keys.push('wildcard');
  return { regex: new RegExp(`^${source}${tail}/?$`), keys };
}

/**
 * @param {Array<{ regex: RegExp, keys: string[] }>} routes - Registered routes.
 * @param {string} path - Requested path.
 * @returns {{ route: object, params: Record<string, string> } | null} Matched route record.
 */
function matchRoute(routes, path) {
  for (const route of routes) {
    const match = route.regex.exec(path);
    if (!match) continue;
    const params = Object.fromEntries(
      route.keys.map((key, i) => [key, decodeURIComponent(match[i + 1] ?? '')]),
    );
    return { route, params };
  }
  return null;
}
