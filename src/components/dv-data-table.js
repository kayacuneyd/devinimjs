/** @module components/dv-data-table - Small sortable table for already-loaded rows. */
import { BaseComponent, html, define } from '../core/core.js';

/** A semantic table that sorts page-provided JSON without imposing a data-fetching strategy. */
export class DvDataTable extends BaseComponent {
  /** @returns {string[]} Live attributes. */
  static observedAttributes = ['data-columns', 'data-rows'];

  /** @returns {{ columns: Array<{ key: string, label: string }>, rows: object[], sort: string, direction: number }} Initial state. */
  initialState() { return { columns: this.#columns(), rows: this.#rows(), sort: '', direction: 1 }; }

  /**
   * @param {string} name - Attribute.
   * @param {string | null} _value - New attribute value.
   */
  onAttribute(name, _value) {
    if (name === 'data-columns') this.state.columns = this.#columns();
    if (name === 'data-rows') this.state.rows = this.#rows();
  }

  /**
   * @param {Event} _event - Click event.
   * @param {Element} button - Header button.
   */
  sortBy(_event, button) {
    const key = button.getAttribute('data-key') ?? '';
    this.state.direction = this.state.sort === key ? this.state.direction * -1 : 1;
    this.state.sort = key;
    this.emit('sort', { key, direction: this.state.direction === 1 ? 'asc' : 'desc' });
  }

  /** @returns {import('../core/html.js').HtmlString} Table markup. */
  template() {
    const rows = [...this.state.rows];
    if (this.state.sort) rows.sort((left, right) => String(left[this.state.sort] ?? '').localeCompare(String(right[this.state.sort] ?? '')) * this.state.direction);
    return html`<div class="dv-data-table"><table><caption>${this.str('label', 'Data table')}</caption><thead><tr>${this.state.columns.map((column) => html`<th scope="col"><button type="button" data-key="${column.key}" aria-sort="${this.state.sort === column.key ? (this.state.direction === 1 ? 'ascending' : 'descending') : 'none'}" data-on:click="sortBy">${column.label}</button></th>`)}</tr></thead><tbody>${rows.map((row) => html`<tr>${this.state.columns.map((column) => html`<td>${row[column.key] ?? ''}</td>`)}</tr>`)}</tbody></table></div>`;
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
}

define('dv-data-table', DvDataTable);
