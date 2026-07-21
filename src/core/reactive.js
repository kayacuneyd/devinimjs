/**
 * @module core/reactive
 * Proxy-based deep reactivity for DevinimJS. Zero dependencies, no build step required.
 *
 * Design notes:
 * - Only plain objects and arrays are wrapped. Class instances (Date, Map, …) are passed
 *   through untouched; mutating them does NOT trigger updates (documented limitation, YAGNI).
 * - Proxies are cached per createReactive() root, so wrapping the same object twice within one
 *   state tree returns the identical proxy (stable identity for `===` checks).
 */

/**
 * Returns true when the value is a plain object or an array — the only shapes we make reactive.
 *
 * @param {*} value - Value to test.
 * @returns {boolean} True for plain objects/arrays, false for primitives and class instances.
 */
function isWrappable(value) {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return true;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Creates a deeply reactive proxy of the given state object.
 *
 * Every `set`/`deleteProperty` anywhere in the object graph invokes `onChange` with the
 * dot-separated path that changed (e.g. `"user.name"`, `"items.0"`). Setting a property to its
 * current value is a no-op and does not notify.
 *
 * @param {object} target - The raw state object (not modified; a proxy of it is returned).
 * @param {(path: string) => void} onChange - Called synchronously after each mutation.
 * @returns {object} A reactive proxy of `target`.
 *
 * @example
 * const state = createReactive({ count: 0 }, (path) => console.log('changed:', path));
 * state.count += 1; // logs: changed: count
 */
export function createReactive(target, onChange) {
  /** @type {WeakMap<object, object>} Per-root proxy cache for stable identity. */
  const cache = new WeakMap();

  /**
   * Recursively wraps a value in a notifying proxy when it is wrappable.
   *
   * @param {*} value - The value to wrap.
   * @param {string} path - Dot-separated path leading to this value.
   * @returns {*} The proxy, or the original value when not wrappable.
   */
  function wrap(value, path) {
    if (!isWrappable(value)) return value;
    if (cache.has(value)) return cache.get(value);

    const proxy = new Proxy(value, {
      get(obj, key, receiver) {
        const child = Reflect.get(obj, key, receiver);
        return wrap(child, path === '' ? String(key) : `${path}.${String(key)}`);
      },
      set(obj, key, next, receiver) {
        const had = Object.prototype.hasOwnProperty.call(obj, key);
        const prev = obj[key];
        const ok = Reflect.set(obj, key, next, receiver);
        if (!had || prev !== next) {
          onChange(path === '' ? String(key) : `${path}.${String(key)}`);
        }
        return ok;
      },
      deleteProperty(obj, key) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          Reflect.deleteProperty(obj, key);
          onChange(path === '' ? String(key) : `${path}.${String(key)}`);
        }
        return true;
      },
    });

    cache.set(value, proxy);
    return proxy;
  }

  return wrap(target, '');
}
