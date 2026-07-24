/** @module components/dv-data-table - Small sortable, filterable, paginated table for already-loaded rows. */
import { BaseComponent, html, define } from '../core/core.js';
import { t, registerLocales, onLocaleChange } from '../core/i18n.js';
import locales from './dv-data-table.locale.js';
import './dv-pagination.js';

registerLocales('dv-data-table', locales);

/**
 * Compares two cell values for sorting: numeric-aware when both sides parse as finite numbers,
 * lexicographic (locale-aware) otherwise.
 *
 * @param {*} left - Left cell value.
 * @param {*} right - Right cell value.
 * @returns {number} Negative, zero or positive per the standard comparator contract.
 */
function compareValues(left, right) {
  const leftText = String(left ?? '');
  const rightText = String(right ?? '');
  const leftNumber = Number(leftText);
  const rightNumber = Number(rightText);
  const bothNumeric = leftText !== '' && rightText !== '' && Number.isFinite(leftNumber) && Number.isFinite(rightNumber);
  return bothNumeric ? leftNumber - rightNumber : leftText.localeCompare(rightText);
}

/**
 * A semantic table that sorts, filters and paginates page-provided JSON without imposing a
 * data-fetching strategy. Filtering and pagination both operate on `this.state.rows` as already
 * loaded — this component never fetches; see the module docstring.
 */
export class DvDataTable extends BaseComponent {
  /** @returns {string[]} Live attributes. */
  static observedAttributes = ['data-columns', 'data-rows', 'data-page-size'];

  /** @type {number} Filtered+sorted row count from the most recent render (pagination's `data-total`). */
  #visibleTotal = 0;

  /**
   * @returns {{ columns: Array<{ key: string, label: string }>, rows: object[], sort: string,
   *   direction: number, filter: string, page: number, pageSize: number }} Initial state.
   */
  initialState() {
    return {
      columns: this.#columns(),
      rows: this.#rows(),
      sort: '',
      direction: 1,
      filter: '',
      page: 1,
      pageSize: this.#pageSize(),
    };
  }

  /**
   * @param {string} name - Attribute.
   * @param {string | null} _value - New attribute value.
   */
  onAttribute(name, _value) {
    if (name === 'data-columns') this.state.columns = this.#columns();
    if (name === 'data-rows') {
      this.state.rows = this.#rows();
      this.state.page = 1; // a shrunk row set must not leave the view stranded on an empty page
    }
    if (name === 'data-page-size') {
      this.state.pageSize = this.#pageSize();
      this.state.page = 1;
    }
  }

  /**
   * @param {Event} _event - Click event.
   * @param {Element} button - Header button.
   */
  sortBy(_event, button) {
    const key = button.getAttribute('data-key') ?? '';
    this.state.direction = this.state.sort === key ? this.state.direction * -1 : 1;
    this.state.sort = key;
    this.state.page = 1; // switching sort can change which rows land on the previous page number
    this.emit('sort', { key, direction: this.state.direction === 1 ? 'asc' : 'desc' });
  }

  /**
   * @param {Event} _event - Input event.
   * @param {Element} input - The filter `<input>`.
   */
  onFilter(_event, input) {
    this.state.filter = /** @type {HTMLInputElement} */ (input).value;
    this.state.page = 1; // narrowing/widening the match set invalidates the current page
    this.emit('filter', { query: this.state.filter });
  }

  /**
   * @param {CustomEvent<{ page: number }>} event - `dv:page` from the composed `<dv-pagination>`.
   */
  onPage(event) {
    this.state.page = event.detail.page;
  }

  /**
   * Subscribes to active-locale changes (ADR-0019), then mounts the composed `<dv-pagination>`
   * (if enabled). Order matters: the locale subscription must be registered before
   * `#syncPagination()` creates the child `<dv-pagination>`, so that a later `setLocale()` call
   * re-renders this component (and forwards the freshly-resolved `pagination-label`, via
   * `#syncPagination()`'s `updated()` re-run) before the child's own `onLocaleChange` subscriber
   * re-renders it — both queued microtasks run in registration order, so the child always reads
   * the fresh forwarded `data-label` override on its own next render.
   */
  connected() {
    this.onCleanup(onLocaleChange(() => this.requestUpdate()));
    this.#syncPagination();
  }

  /**
   * @param {string[]} _changedKeys - Unused: pagination is re-synced unconditionally since its
   *   inputs (visible total, page, page size) can shift for reasons state alone doesn't name
   *   (re-filtering changes the total row count without a `pageSize`/`page` key changing).
   */
  updated(_changedKeys) {
    this.#syncPagination();
  }

  /** @returns {object[]} `this.state.rows` narrowed by the current filter query, case-insensitively. */
  #filteredRows() {
    const query = this.state.filter.trim().toLowerCase();
    if (!query) return this.state.rows;
    return this.state.rows.filter((row) =>
      this.state.columns.some((column) => String(row[column.key] ?? '').toLowerCase().includes(query)),
    );
  }

  /** @returns {import('../core/html.js').HtmlString} Table markup. */
  template() {
    const filtered = this.#filteredRows();
    const sorted = [...filtered];
    if (this.state.sort) sorted.sort((left, right) => compareValues(left[this.state.sort], right[this.state.sort]) * this.state.direction);
    this.#visibleTotal = sorted.length;

    const pageSize = this.state.pageSize;
    const pageRows = pageSize > 0 ? sorted.slice((this.state.page - 1) * pageSize, this.state.page * pageSize) : sorted;

    // `<dv-pagination>` is deliberately NOT written here. `morph()` only exempts the literal
    // `<dv-outlet>` tag from recursive diffing (ADR-0009); any other nested custom element's
    // self-rendered DOM (its own `<nav>`/buttons) would be diffed against this template's text
    // for it — which never describes that child's internals — and get wiped out on every
    // subsequent re-render of this component. Mounting it inside a private outlet instead
    // (`#syncPagination`) keeps its DOM outside this component's diffing entirely.
    return html`<div class="dv-data-table">
      <label class="dv-data-table-filter">${t(this, 'filterLabel', 'Filter')}<input type="search" value="${this.state.filter}" data-on:input="onFilter"></label>
      <table>
        <caption>${t(this, 'label', 'Data table')}</caption>
        <thead><tr>${this.state.columns.map((column) => html`<th scope="col" aria-sort="${this.state.sort === column.key ? (this.state.direction === 1 ? 'ascending' : 'descending') : 'none'}"><button type="button" data-key="${column.key}" data-on:click="sortBy">${column.label}</button></th>`)}</tr></thead>
        <tbody>${pageRows.map((row) => html`<tr>${this.state.columns.map((column) => html`<td>${row[column.key] ?? ''}</td>`)}</tr>`)}</tbody>
      </table>
      ${pageSize > 0 && html`<dv-outlet class="dv-data-table-pagination"></dv-outlet>`}
    </div>`;
  }

  /**
   * Mounts (once) and updates the composed `<dv-pagination>` inside the private outlet from
   * `template()`. No-ops when pagination is disabled (`data-page-size` absent or `0`) — the
   * outlet itself is then absent from the render, so any previously-mounted `<dv-pagination>`
   * is removed by `morph()` along with it.
   *
   * @returns {void}
   */
  #syncPagination() {
    const outlet = this.querySelector('dv-outlet.dv-data-table-pagination');
    if (!outlet) return;

    let pagination = outlet.querySelector('dv-pagination');
    if (!pagination) {
      pagination = document.createElement('dv-pagination');
      pagination.addEventListener('dv:page', (event) => this.onPage(/** @type {CustomEvent<{ page: number }>} */ (event)));
      outlet.appendChild(pagination);
    }

    // Order matters: dv-pagination clamps `page` against its *current* total/size on every
    // attribute write (ADR — see its own onAttribute), so total/size land before page.
    const attrs = {
      'data-size': String(this.state.pageSize),
      'data-total': String(this.#visibleTotal),
      'data-page': String(this.state.page),
      'data-label': t(this, 'paginationLabel', 'Pagination'),
    };
    for (const [name, value] of Object.entries(attrs)) {
      if (pagination.getAttribute(name) !== value) pagination.setAttribute(name, value);
    }
  }

  /** @returns {Array<{ key: string, label: string }>} Parsed columns. */
  #columns() {
    const columns = this.json('columns', []);
    return Array.isArray(columns) ? columns.map((column) => typeof column === 'string' ? { key: column, label: column } : { key: String(column?.key ?? ''), label: String(column?.label ?? column?.key ?? '') }).filter((column) => column.key) : [];
  }

  /** @returns {object[]} Parsed rows. */
  #rows() {
    const rows = this.json('rows', []);
    return Array.isArray(rows) ? rows.filter((row) => row && typeof row === 'object') : [];
  }

  /** @returns {number} Rows per page; 0 (absent or explicit) disables pagination. */
  #pageSize() {
    return Math.max(0, this.num('pageSize', 0));
  }
}

define('dv-data-table', DvDataTable);
