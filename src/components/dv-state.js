/** @module components/dv-state - Loading, empty and error status region. */
import { BaseComponent, html, define } from '../core/core.js';
import { t, registerLocales, onLocaleChange } from '../core/i18n.js';
import locales from './dv-state.locale.js';

registerLocales('dv-state', locales);

/** Predictable async-list state indicator; content fetching belongs to the page. */
export class DvState extends BaseComponent {
  /** @returns {string[]} Live attributes. */
  static observedAttributes = ['data-state'];
  /** @returns {{ status: string }} Initial state. */
  initialState() { return { status: this.str('state', 'empty') }; }
  /** Subscribes to active-locale changes (ADR-0019). */
  connected() {
    this.onCleanup(onLocaleChange(() => this.requestUpdate()));
  }
  /**
   * @param {string} name - Attribute name.
   * @param {string | null} value - New value.
   */
  onAttribute(name, value) { if (name === 'data-state') this.state.status = value ?? 'empty'; }
  /** Emits a retry request for the page to handle. */
  retry() { this.emit('retry'); }
  /** @returns {import('../core/html.js').HtmlString} State markup. */
  template() {
    if (this.state.status === 'loading') return html`<p class="dv-state" role="status">${t(this, 'loading', 'Loading…')}</p>`;
    if (this.state.status === 'error') return html`<section class="dv-state" role="alert"><p>${t(this, 'error', 'Something went wrong.')}</p><button type="button" data-on:click="retry">${t(this, 'retryLabel', 'Try again')}</button></section>`;
    return html`<p class="dv-state">${t(this, 'empty', 'Nothing to show yet.')}</p>`;
  }
}

define('dv-state', DvState);
