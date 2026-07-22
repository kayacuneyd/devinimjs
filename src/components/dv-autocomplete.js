/** @module components/dv-autocomplete - Local-data combobox with a clear selection event. */
import { BaseComponent, html, define } from '../core/core.js';

let instanceSeq = 0;

/** A small accessible combobox; remote data loading stays in application code. */
export class DvAutocomplete extends BaseComponent {
  /** @returns {string[]} Live attributes. */
  static observedAttributes = ['data-items', 'data-query'];

  #instanceId = ++instanceSeq;

  /** @returns {{ items: string[], query: string, open: boolean }} Initial state. */
  initialState() { return { items: this.#items(), query: this.str('query'), open: false }; }

  /**
   * @param {string} name - Attribute.
   * @param {string | null} value - New attribute value.
   */
  onAttribute(name, value) {
    if (name === 'data-items') this.state.items = this.#items();
    if (name === 'data-query') this.state.query = value ?? '';
  }

  /**
   * @param {Event} _event - Input event.
   * @param {HTMLInputElement} input - Combobox input.
   */
  onInput(_event, input) {
    this.state.query = input.value;
    this.state.open = true;
    this.emit('query', { query: input.value });
  }

  /**
   * @param {Event} _event - Click event.
   * @param {Element} option - Selected option.
   */
  pick(_event, option) {
    const value = option.getAttribute('data-value') ?? '';
    this.state.query = value;
    this.state.open = false;
    this.emit('select', { value });
  }

  /** Closes the list after a click outside it can be observed. */
  close() { setTimeout(() => { this.state.open = false; }, 0); }

  /** @returns {import('../core/html.js').HtmlString} Combobox markup. */
  template() {
    const listId = `dv-autocomplete-${this.#instanceId}-list`;
    const query = this.state.query.toLocaleLowerCase();
    const items = this.state.items.filter((item) => item.toLocaleLowerCase().includes(query));
    return html`<div class="dv-autocomplete"><label>${this.str('label', 'Search')}<input role="combobox" type="search" value="${this.state.query}" aria-expanded="${String(this.state.open)}" aria-controls="${listId}" aria-autocomplete="list" data-on:input="onInput" data-on:blur="close"></label><ul id="${listId}" role="listbox" hidden="${!this.state.open}">${items.map((item) => html`<li role="option"><button type="button" data-value="${item}" data-on:click="pick">${item}</button></li>`)}</ul></div>`;
  }

  /** @returns {string[]} Parsed local suggestions. */
  #items() {
    const value = this.json('items', []);
    return Array.isArray(value) ? value.map(String) : [];
  }
}

define('dv-autocomplete', DvAutocomplete);
