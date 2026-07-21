/**
 * @module components/dv-modal
 * Light-DOM modal dialog. Styling is intentionally delegated to the consumer's global CSS.
 */

import { BaseComponent, html, define } from '../core/core.js';

let instanceSeq = 0;

/** Accessible modal dialog with Escape and close-button support. */
export class DvModal extends BaseComponent {
  /** @returns {string[]} Live-synced attributes. */
  static observedAttributes = ['data-open'];

  #instanceId = ++instanceSeq;
  #opener = null;

  /** @returns {{ open: boolean }} Initial modal state. */
  initialState() {
    return { open: this.bool('open', false) };
  }

  /** Focuses an initially open dialog. */
  connected() {
    if (this.state.open) this.#focusDialog();
  }

  /** @param {string[]} changedKeys - State keys changed in the render batch. */
  updated(changedKeys) {
    if (changedKeys.includes('open') && this.state.open) this.#focusDialog();
    if (changedKeys.includes('open') && !this.state.open) this.#opener?.focus();
  }

  /**
   * @param {string} name - Changed attribute.
   * @param {string | null} newValue - New value.
   */
  onAttribute(name, newValue) {
    if (name === 'data-open') this.state.open = newValue !== null && newValue !== 'false' && newValue !== '0';
  }

  /**
   * @param {Event} _event - Triggering event.
   * @param {Element} el - Opening control.
   */
  open(_event, el) {
    this.#opener = el instanceof HTMLElement ? el : document.activeElement;
    this.#setOpen(true);
  }

  /** Closes the dialog and restores focus to its recorded opener. */
  close() {
    this.#setOpen(false);
  }

  /** @param {KeyboardEvent} event - Dialog key event. */
  onKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  /** @param {boolean} open - Desired open state. */
  #setOpen(open) {
    if (open === this.state.open) return;
    this.state.open = open;
    this.emit(open ? 'open' : 'close');
  }

  /** Queues focus until the dialog is visible in the patched DOM. */
  #focusDialog() {
    queueMicrotask(() => this.querySelector('[role="dialog"]')?.focus());
  }

  /** @returns {import('../core/html.js').HtmlString} Modal markup. */
  template() {
    const titleId = `dv-modal-${this.#instanceId}-title`;
    return html`
      <div class="dv-modal-backdrop" hidden="${!this.state.open}">
        <section class="dv-modal" role="dialog" aria-modal="true" aria-labelledby="${titleId}"
          tabindex="-1" data-on:keydown="onKeydown">
          <header>
            <h2 id="${titleId}">${this.str('label', 'Dialog')}</h2>
            <button type="button" aria-label="Close" data-on:click="close">×</button>
          </header>
          <div class="dv-modal-content">${this.outlet}</div>
        </section>
      </div>
    `;
  }
}

define('dv-modal', DvModal);
