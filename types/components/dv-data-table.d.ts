/**
 * A semantic table that sorts, filters and paginates page-provided JSON without imposing a
 * data-fetching strategy. Filtering and pagination both operate on `this.state.rows` as already
 * loaded — this component never fetches; see the module docstring.
 */
export class DvDataTable extends BaseComponent {
    /** @returns {string[]} Live attributes. */
    static observedAttributes: string[];
    /**
     * @returns {{ columns: Array<{ key: string, label: string }>, rows: object[], sort: string,
     *   direction: number, filter: string, page: number, pageSize: number }} Initial state.
     */
    initialState(): {
        columns: Array<{
            key: string;
            label: string;
        }>;
        rows: object[];
        sort: string;
        direction: number;
        filter: string;
        page: number;
        pageSize: number;
    };
    /**
     * @param {string} name - Attribute.
     * @param {string | null} _value - New attribute value.
     */
    onAttribute(name: string, _value: string | null): void;
    /**
     * @param {Event} _event - Click event.
     * @param {Element} button - Header button.
     */
    sortBy(_event: Event, button: Element): void;
    /**
     * @param {Event} _event - Input event.
     * @param {Element} input - The filter `<input>`.
     */
    onFilter(_event: Event, input: Element): void;
    /**
     * @param {CustomEvent<{ page: number }>} event - `dv:page` from the composed `<dv-pagination>`.
     */
    onPage(event: CustomEvent<{
        page: number;
    }>): void;
    #private;
}
import { BaseComponent } from '../core/core.js';
