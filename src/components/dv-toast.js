/** @module components/dv-toast - Accessible, self-timed status notification. */

import { BaseComponent, html, define } from '../core/core.js';

/** Status toast for page-level or component-level feedback. */
export class DvToast extends BaseComponent {
  static observedAttributes = ['data-message', 'data-open'];

  #timer = null;

  /** @returns {{ open: boolean, message: string }} Initial toast state. */
  initialState() {
    return { open: this.bool('open', false), message: this.str('message', '') };
  }

  /** Starts auto-dismiss for an initially open toast. */
  connected() {
    if (this.state.open) this.#scheduleDismiss();
  }

  /**
   * @param {string} name - Changed attribute.
   * @param {string | null} newValue - New value.
   */
  onAttribute(name, newValue) {
    if (name === 'data-message') this.state.message = newValue ?? '';
    if (name === 'data-open') this.state.open = newValue !== null && newValue !== 'false' && newValue !== '0';
  }

  /**
   * Shows a message and restarts its auto-dismiss timer.
   * @param {string} message - Message text.
   */
  show(message) {
    this.state.message = message;
    this.state.open = true;
    this.#scheduleDismiss();
    this.emit('show', { message });
  }

  /** Hides the toast. */
  hide() {
    if (!this.state.open) return;
    this.state.open = false;
    this.#clearTimer();
    this.emit('hide');
  }

  /** @returns {import('../core/html.js').HtmlString} Toast markup. */
  template() {
    return html`<output class="dv-toast" role="status" aria-live="polite" hidden="${!this.state.open}">${this.state.message}</output>`;
  }

  /** Schedules a timer that is cleaned up automatically on disconnect. */
  #scheduleDismiss() {
    this.#clearTimer();
    const duration = this.num('duration', 5000);
    if (duration <= 0) return;
    this.#timer = setTimeout(() => this.hide(), duration);
    this.onCleanup(() => this.#clearTimer());
  }

  /** Clears the active auto-dismiss timer. */
  #clearTimer() {
    if (this.#timer !== null) clearTimeout(this.#timer);
    this.#timer = null;
  }
}

define('dv-toast', DvToast);
