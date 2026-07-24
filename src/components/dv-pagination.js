/** @module components/dv-pagination - Accessible page navigation for server or API lists. */

import { BaseComponent, html, define } from '../core/core.js';
import { t, registerLocales, onLocaleChange } from '../core/i18n.js';
import locales from './dv-pagination.locale.js';

registerLocales('dv-pagination', locales);

/** Sentinel marking a truncation gap in the rendered page-number list. */
const ELLIPSIS = Symbol('ellipsis');

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

  /** Subscribes to active-locale changes (ADR-0019). */
  connected() { this.onCleanup(onLocaleChange(() => this.requestUpdate())); }

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

  /**
   * Reads the jump-to-page input and navigates there. Invalid text (e.g. `"abc"`) and
   * out-of-range numbers are clamped by `goTo`/`#clamp` exactly like any other `goTo` call — no
   * separate validation is needed here, and a bad value can never crash or emit an out-of-range
   * page.
   *
   * @param {Event} event - Form submit event (from the jump-to-page control).
   * @param {Element} el - The `<form>` carrying the jump input.
   */
  jumpToPage(event, el) {
    event.preventDefault();
    const input = el.querySelector('[data-pagination-jump-input]');
    if (!input) return;
    this.goTo(Number(input.value));
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
    const current = this.state.page;
    return html`
      <nav aria-label="${t(this, 'label', 'Pagination')}">
        <button type="button" data-page="${current - 1}" data-on:click="goToButton"
          aria-label="${t(this, 'previousPageLabel', 'Previous page')}" disabled="${current <= 1}">${t(this, 'previousLabel', 'Previous')}</button>
        <ul class="dv-pagination-list">
          ${this.#pageWindow(current, pages).map((entry) => (entry === ELLIPSIS
            ? html`<li class="dv-pagination-ellipsis" aria-hidden="true">&hellip;</li>`
            : html`
              <li>
                <button type="button" data-page="${entry}" data-on:click="goToButton"
                  aria-current="${entry === current ? 'page' : null}"
                  aria-label="${t(this, 'pageLabel', 'Page {page}', { page: entry })}">${entry}</button>
              </li>
            `))}
        </ul>
        <span class="dv-pagination-status">Page ${current} of ${pages}</span>
        <button type="button" data-page="${current + 1}" data-on:click="goToButton"
          aria-label="${t(this, 'nextPageLabel', 'Next page')}" disabled="${current >= pages}">${t(this, 'nextLabel', 'Next')}</button>
        <form class="dv-pagination-jump" data-on:submit="jumpToPage">
          <label>
            ${t(this, 'jumpLabel', 'Jump to page')}
            <input type="number" inputmode="numeric" step="1" min="1" max="${pages}" value="${current}"
              data-pagination-jump-input aria-label="${t(this, 'jumpAriaLabel', 'Jump to page, 1 to {pages}', { pages })}">
          </label>
          <button type="submit">${t(this, 'goLabel', 'Go')}</button>
        </form>
      </nav>
    `;
  }

  /**
   * Builds the truncated page-number window: every page when the count is small (≤ 7), otherwise
   * the first page, the last page, and up to two pages either side of the current page (7 slots
   * total once they stop overlapping), with an `ELLIPSIS` marker inserted for any gap larger than
   * one page — e.g. `1 … 8 9 10 11 12 … 20`.
   *
   * @param {number} current - Current one-based page.
   * @param {number} pages - Total page count.
   * @returns {Array<number | symbol>} Ordered entries: page numbers or `ELLIPSIS`.
   */
  #pageWindow(current, pages) {
    if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);

    const kept = [...new Set([1, pages, current - 2, current - 1, current, current + 1, current + 2])]
      .filter((page) => page >= 1 && page <= pages)
      .sort((a, b) => a - b);

    const entries = [];
    let previous = null;
    for (const page of kept) {
      if (previous !== null && page - previous > 1) entries.push(ELLIPSIS);
      entries.push(page);
      previous = page;
    }
    return entries;
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
