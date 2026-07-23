/** A semantic table that sorts page-provided JSON without imposing a data-fetching strategy. */
export class DvDataTable extends BaseComponent {
    /** @returns {string[]} Live attributes. */
    static observedAttributes: string[];
    /** @returns {{ columns: Array<{ key: string, label: string }>, rows: object[], sort: string, direction: number }} Initial state. */
    initialState(): {
        columns: Array<{
            key: string;
            label: string;
        }>;
        rows: object[];
        sort: string;
        direction: number;
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
    #private;
}
import { BaseComponent } from '../core/core.js';
