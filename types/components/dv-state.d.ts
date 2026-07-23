/** Predictable async-list state indicator; content fetching belongs to the page. */
export class DvState extends BaseComponent {
    /** @returns {string[]} Live attributes. */
    static observedAttributes: string[];
    /** @returns {{ status: string }} Initial state. */
    initialState(): {
        status: string;
    };
    /**
     * @param {string} name - Attribute name.
     * @param {string | null} value - New value.
     */
    onAttribute(name: string, value: string | null): void;
    /** Emits a retry request for the page to handle. */
    retry(): void;
}
import { BaseComponent } from '../core/core.js';
