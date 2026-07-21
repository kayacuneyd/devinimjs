/**
 * @module components/dv-disclosure
 * Accessible show/hide content with a PHP-friendly light-DOM children API.
 */

import { BaseComponent, html, define } from '../core/core.js';

let instanceSeq = 0;

/** Accessible disclosure component. */
export class DvDisclosure extends BaseComponent {
  /** @returns {string[]} Live-synced attributes. */
  static observedAttributes = ['data-open'];

  #instanceId = ++instanceSeq;

  /** @returns {{ open: boolean }} Initial disclosure state. */
  initialState() {
    return { open: this.bool('open', false) };
  }

  /**
   * @param {string} name - Changed attribute.
   * @param {string | null} newValue - New value.
   */
  onAttribute(name, newValue) {
    if (name === 'data-open') this.state.open = newValue !== null && newValue !== 'false' && newValue !== '0';
  }

  /** Toggles content visibility and emits `dv:toggle`. */
  toggle() {
    this.state.open = !this.state.open;
    this.emit('toggle', { open: this.state.open });
  }

  /** @returns {import('../core/html.js').HtmlString} Disclosure markup. */
  template() {
    const panelId = `dv-disclosure-${this.#instanceId}-panel`;
    return html`
      <button type="button" aria-expanded="${String(this.state.open)}" aria-controls="${panelId}"
        data-on:click="toggle">${this.str('summary', 'Details')}</button>
      <div id="${panelId}" hidden="${!this.state.open}">${this.outlet}</div>
    `;
  }
}

define('dv-disclosure', DvDisclosure);
