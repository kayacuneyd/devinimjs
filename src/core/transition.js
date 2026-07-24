/**
 * @module core/transition
 * Minimal transition-timing primitive (ADR-0018): "wait for a CSS transition/animation to
 * finish on an element, with a timeout fallback so nothing ever hangs indefinitely on a
 * consumer who hasn't defined any CSS transition."
 *
 * Deliberately **not** re-exported from `core/core.js` — component files import it directly
 * from this module. `npm run size` only measures `core.js` and whatever its export barrel
 * re-exports (verified across TASK-004..006), so keeping this import path separate keeps the
 * primitive entirely outside the size-gated core budget (ADR-0018).
 *
 * This is not an animation library: no easing curves, no keyframe sequencing, no spring
 * physics — one function, one job (ADR-0010 YAGNI).
 */

/** Fallback wait applied when no transitionend/animationend ever fires on the element (ms). */
const DEFAULT_TIMEOUT = 200;

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
export function awaitTransition(el, { timeout = DEFAULT_TIMEOUT } = {}) {
  return new Promise((resolve) => {
    let settled = false;

    /** Resolves the promise exactly once and tears down every listener/timer. */
    const finish = () => {
      if (settled) return;
      settled = true;
      el.removeEventListener('transitionend', onEnd);
      el.removeEventListener('animationend', onEnd);
      clearTimeout(timer);
      resolve();
    };

    /** @param {Event} event - The transition/animation end event. */
    const onEnd = (event) => {
      if (event.target !== el) return; // a descendant's own transition doesn't count
      finish();
    };

    el.addEventListener('transitionend', onEnd);
    el.addEventListener('animationend', onEnd);
    const timer = setTimeout(finish, timeout);
  });
}
