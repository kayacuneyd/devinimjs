/** @module components/dv-search - Search field with a bubbling query event. */
import { BaseComponent, html, define } from '../core/core.js';

/** Search input that emits `dv:query` as its value changes. */
export class DvSearch extends BaseComponent {
  /** @returns {{ query: string }} Initial state. */ initialState() { return { query: this.str('query', '') }; }
  /**
   * @param {Event} _event - Input event.
   * @param {HTMLInputElement} el - Input.
   */
  onInput(_event, el) { this.state.query = el.value; this.emit('query', { query: this.state.query }); }
  /** Clears the active query. */ clear() { if (!this.state.query) return; this.state.query = ''; this.emit('query', { query: '' }); }
  /** @returns {import('../core/html.js').HtmlString} Markup. */ template() { return html`<div class="dv-search"><label>${this.str('label', 'Search')}<input type="search" value="${this.state.query}" placeholder="${this.str('placeholder', 'Search')}" data-on:input="onInput"></label><button type="button" data-on:click="clear" disabled="${!this.state.query}">Clear</button></div>`; }
}
define('dv-search', DvSearch);
