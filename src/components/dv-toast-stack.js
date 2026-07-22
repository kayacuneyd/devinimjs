/** @module components/dv-toast-stack - Page-level queue of status messages. */
import { BaseComponent, html, define } from '../core/core.js';

/** A multi-message live region with explicit and timed dismissal. */
export class DvToastStack extends BaseComponent {
  #sequence = 0;
  #timers = new Map();

  /** @returns {{ items: Array<{ id: number, message: string }> }} Initial state. */
  initialState() { return { items: [] }; }

  /**
   * @param {string} message - Message text.
   * @returns {number} Message id.
   */
  show(message) {
    const id = ++this.#sequence;
    this.state.items.push({ id, message: String(message) });
    const duration = this.num('duration', 5000);
    if (duration > 0) this.#timers.set(id, setTimeout(() => this.dismiss(id), duration));
    this.emit('show', { id, message: String(message) });
    return id;
  }

  /** @param {number | string} id - Message id. */
  dismiss(id) {
    const numericId = Number(id);
    const timer = this.#timers.get(numericId);
    if (timer) clearTimeout(timer);
    this.#timers.delete(numericId);
    const item = this.state.items.find((entry) => entry.id === numericId);
    this.state.items = this.state.items.filter((entry) => entry.id !== numericId);
    if (item) this.emit('hide', { id: numericId, message: item.message });
  }

  /**
   * @param {Event} _event - Click event.
   * @param {Element} button - Dismiss button.
   */
  dismissButton(_event, button) { this.dismiss(button.getAttribute('data-id') ?? ''); }

  /** Releases timers when removed from the document. */
  disconnected() { for (const timer of this.#timers.values()) clearTimeout(timer); this.#timers.clear(); }

  /** @returns {import('../core/html.js').HtmlString} Stack markup. */
  template() { return html`<section class="dv-toast-stack" aria-live="polite" aria-label="${this.str('label', 'Notifications')}">${this.state.items.map((item) => html`<output role="status">${item.message}<button type="button" aria-label="Dismiss" data-id="${item.id}" data-on:click="dismissButton">×</button></output>`)}</section>`; }
}

define('dv-toast-stack', DvToastStack);
