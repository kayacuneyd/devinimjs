/** @module components/dv-dropdown - Accessible light-DOM dropdown menu. */
import { BaseComponent, html, define } from '../core/core.js';

/** Toggleable menu that preserves consumer-provided menu content. */
export class DvDropdown extends BaseComponent {
  /** @returns {string[]} Live attributes. */ static observedAttributes = ['data-open'];
  /** @returns {{ open: boolean }} Initial state. */ initialState() { return { open: this.bool('open', false) }; }
  /**
   * @param {string} name - Attribute.
   * @param {string | null} value - Value.
   */
  onAttribute(name, value) { if (name === 'data-open') this.state.open = value !== null && value !== 'false'; }
  /** Toggles the menu. */ toggle() { this.state.open = !this.state.open; this.emit('toggle', { open: this.state.open }); }
  /** @param {KeyboardEvent} event - Key event. */ onKeydown(event) { if (event.key === 'Escape' && this.state.open) { event.preventDefault(); this.state.open = false; } }
  /** @returns {import('../core/html.js').HtmlString} Markup. */ template() { return html`<div class="dv-dropdown" data-on:keydown="onKeydown"><button type="button" aria-expanded="${String(this.state.open)}" data-on:click="toggle">${this.str('label', 'Menu')}</button><div role="menu" hidden="${!this.state.open}">${this.outlet}</div></div>`; }
}
define('dv-dropdown', DvDropdown);
