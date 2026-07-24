/** @module components/dv-toast-stack - Page-level queue of status messages. */
import { BaseComponent, html, define } from '../core/core.js';
import { awaitTransition } from '../core/transition.js';

/** A multi-message live region with explicit and timed dismissal. */
export class DvToastStack extends BaseComponent {
  #sequence = 0;
  #timers = new Map();

  /**
   * @returns {{ items: Array<{ id: number, message: string, leaving: boolean }> }} Initial
   * state. `leaving` (ADR-0018) keeps a dismissed item mounted through its exit transition
   * instead of the array-splice removing it from the DOM the instant `dismiss()` runs.
   */
  initialState() { return { items: [] }; }

  /**
   * @param {string} message - Message text.
   * @returns {number} Message id.
   */
  show(message) {
    const id = ++this.#sequence;
    this.state.items.push({ id, message: String(message), leaving: false });
    const duration = this.num('duration', 5000);
    if (duration > 0) {
      const timer = setTimeout(() => this.dismiss(id), duration);
      // A stack shows/dismisses toasts throughout a long-lived page, so the per-timer cleanup
      // is un-registered on early dismissal too — otherwise #cleanupFns would keep accumulating
      // one stale no-op entry per toast for the component's whole lifetime.
      const cancelCleanup = this.onCleanup(() => clearTimeout(timer));
      this.#timers.set(id, { timer, cancelCleanup });
    }
    this.emit('show', { id, message: String(message) });
    return id;
  }

  /**
   * Marks the item as leaving (keeping it mounted for its exit transition) and emits `dv:hide`
   * immediately — both unchanged in timing from before this primitive existed (ADR-0018).
   * Removal from `state.items` itself is deferred until the item's exit transition (or the
   * primitive's timeout fallback) resolves.
   *
   * @param {number | string} id - Message id.
   */
  dismiss(id) {
    const numericId = Number(id);
    const entry = this.#timers.get(numericId);
    if (entry) { clearTimeout(entry.timer); entry.cancelCleanup(); }
    this.#timers.delete(numericId);
    const item = this.state.items.find((entry) => entry.id === numericId);
    if (!item || item.leaving) return; // already dismissed or mid-leave — no duplicate dv:hide
    this.emit('hide', { id: numericId, message: item.message });
    item.leaving = true;
    const finalize = () => {
      this.state.items = this.state.items.filter((entry) => entry.id !== numericId);
    };
    const el = this.querySelector(`[data-key="${numericId}"]`);
    if (!el) { finalize(); return; }
    awaitTransition(el).then(finalize);
  }

  /**
   * @param {Event} _event - Click event.
   * @param {Element} button - Dismiss button.
   */
  dismissButton(_event, button) { this.dismiss(button.getAttribute('data-id') ?? ''); }

  /** @returns {import('../core/html.js').HtmlString} Stack markup. */
  template() {
    return html`<section class="dv-toast-stack" aria-live="polite" aria-label="${this.str('label', 'Notifications')}">${this.state.items.map((item) => html`<output role="status" data-key="${item.id}" data-leaving="${item.leaving}">${item.message}<button type="button" aria-label="Dismiss" data-id="${item.id}" data-on:click="dismissButton">×</button></output>`)}</section>`;
  }
}

define('dv-toast-stack', DvToastStack);
