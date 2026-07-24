/**
 * Resolves once a `transitionend` or `animationend` event fires on `el` itself (bubbled events
 * from descendants are ignored — a nested element's own transition must not resolve its
 * ancestor's wait), or after `timeout` ms elapses, whichever comes first. Never rejects: a
 * missing, interrupted, or nonexistent CSS transition is treated as "already finished," not as
 * an error, so a consumer who ships no CSS at all never gets a stuck or broken UI.
 *
 * @param {Element} el - Element whose transition/animation completion to wait for.
 * @param {{ timeout?: number }} [options] - `timeout` — fallback delay in ms (default 200).
 * @returns {Promise<void>} Resolves on the transition/animation end event or the timeout.
 *
 * @example
 * // Defer a DOM/state change until an exit transition (or its timeout fallback) completes.
 * el.removeAttribute('hidden');
 * el.dataset.leaving = '';
 * await awaitTransition(el);
 * el.hidden = true;
 */
export function awaitTransition(el: Element, { timeout }?: {
    timeout?: number;
}): Promise<void>;
