/** @module components/dv-confirm - Explicit confirmation control for consequential actions. */
import { BaseComponent, html, define } from '../core/core.js';
import { t, registerLocales, onLocaleChange } from '../core/i18n.js';
import locales from './dv-confirm.locale.js';

registerLocales('dv-confirm', locales);

/** Two-step confirmation button that leaves the action itself to the page. */
export class DvConfirm extends BaseComponent {
  /** @returns {{ pending: boolean }} Initial state. */
  initialState() { return { pending: false }; }

  /** Subscribes to active-locale changes (ADR-0019). */
  connected() { this.onCleanup(onLocaleChange(() => this.requestUpdate())); }

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
    if (!this.state.pending) return html`<button type="button" class="dv-confirm" data-on:click="proceed">${t(this, 'label', 'Delete')}</button>`;
    return html`<span class="dv-confirm" role="group" aria-label="${t(this, 'confirmingLabel', 'Confirm action')}"><span>${t(this, 'message', 'Are you sure?')}</span><button type="button" data-on:click="proceed">${t(this, 'confirmLabel', 'Confirm')}</button><button type="button" data-on:click="cancel">${t(this, 'cancelLabel', 'Cancel')}</button></span>`;
  }
}

define('dv-confirm', DvConfirm);
