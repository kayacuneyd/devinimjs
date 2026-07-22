/** @module components/dv-confirm - Explicit confirmation control for consequential actions. */
import { BaseComponent, html, define } from '../core/core.js';

/** Two-step confirmation button that leaves the action itself to the page. */
export class DvConfirm extends BaseComponent {
  /** @returns {{ pending: boolean }} Initial state. */
  initialState() { return { pending: false }; }

  /** Starts or completes the confirmation sequence. */
  proceed() {
    if (!this.state.pending) {
      this.state.pending = true;
      return;
    }
    this.state.pending = false;
    this.emit('confirm', { value: this.str('value') });
  }

  /** Cancels a pending confirmation. */
  cancel() { this.state.pending = false; this.emit('cancel'); }

  /** @returns {import('../core/html.js').HtmlString} Confirmation markup. */
  template() {
    if (!this.state.pending) return html`<button type="button" class="dv-confirm" data-on:click="proceed">${this.str('label', 'Delete')}</button>`;
    return html`<span class="dv-confirm" role="group" aria-label="${this.str('label', 'Confirm action')}"><span>${this.str('message', 'Are you sure?')}</span><button type="button" data-on:click="proceed">${this.str('confirm-label', 'Confirm')}</button><button type="button" data-on:click="cancel">${this.str('cancel-label', 'Cancel')}</button></span>`;
  }
}

define('dv-confirm', DvConfirm);
