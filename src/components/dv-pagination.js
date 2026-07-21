/** @module components/dv-pagination - Accessible page navigation for server or API lists. */

import { BaseComponent, html, define } from '../core/core.js';

/** Pagination component using one-based pages and a bubbling `dv:page` event. */
export class DvPagination extends BaseComponent {
  /** @returns {string[]} Live-synced attributes. */
  static observedAttributes = ['data-page', 'data-total', 'data-size'];

  /** @returns {{ page: number, total: number, size: number }} Initial pagination state. */
  initialState() {
    const total = Math.max(0, this.num('total', 0));
    const size = Math.max(1, this.num('size', 10));
    return { page: this.#clamp(this.num('page', 1), total, size), total, size };
  }

  /**
   * @param {string} name - Changed attribute.
   * @param {string | null} newValue - New value.
   */
  onAttribute(name, newValue) {
    if (name === 'data-total') this.state.total = Math.max(0, Number(newValue) || 0);
    if (name === 'data-size') this.state.size = Math.max(1, Number(newValue) || 1);
    if (name === 'data-page') this.goTo(Number(newValue) || 1);
    if (name !== 'data-page') this.state.page = this.#clamp(this.state.page, this.state.total, this.state.size);
  }

  /**
   * @param {Event} _event - Triggering event.
   * @param {Element} el - Button carrying page index.
   */
  goToButton(_event, el) {
    this.goTo(Number(el.getAttribute('data-page')));
  }

  /** @param {number} page - Requested one-based page. */
  goTo(page) {
    const next = this.#clamp(page, this.state.total, this.state.size);
    if (next === this.state.page) return;
    this.state.page = next;
    this.emit('page', { page: next });
  }

  /** @returns {import('../core/html.js').HtmlString} Pagination markup. */
  template() {
    const pages = Math.max(1, Math.ceil(this.state.total / this.state.size));
    return html`
      <nav aria-label="${this.str('label', 'Pagination')}">
        <button type="button" data-page="${this.state.page - 1}" data-on:click="goToButton"
          disabled="${this.state.page <= 1}">Previous</button>
        <span aria-current="page">Page ${this.state.page} of ${pages}</span>
        <button type="button" data-page="${this.state.page + 1}" data-on:click="goToButton"
          disabled="${this.state.page >= pages}">Next</button>
      </nav>
    `;
  }

  /**
   * @param {number} page - Requested page.
   * @param {number} total - Item total.
   * @param {number} size - Page size.
   * @returns {number} Valid one-based page.
   */
  #clamp(page, total, size) {
    return Math.min(Math.max(1, Math.ceil(total / size) || 1), Math.max(1, Math.floor(page) || 1));
  }
}

define('dv-pagination', DvPagination);
