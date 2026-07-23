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
export function createReactive(target: object, onChange: (path: string) => void): object;
