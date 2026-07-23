/** A small accessible combobox; remote data loading stays in application code. */
export class DvAutocomplete extends BaseComponent {
    /** @returns {string[]} Live attributes. */
    static observedAttributes: string[];
    /** @returns {{ items: string[], query: string, open: boolean }} Initial state. */
    initialState(): {
        items: string[];
        query: string;
        open: boolean;
    };
    /**
     * @param {string} name - Attribute.
     * @param {string | null} value - New attribute value.
     */
    onAttribute(name: string, value: string | null): void;
    /**
     * @param {Event} _event - Input event.
     * @param {HTMLInputElement} input - Combobox input.
     */
    onInput(_event: Event, input: HTMLInputElement): void;
    /**
     * @param {Event} _event - Click event.
     * @param {Element} option - Selected option.
     */
    pick(_event: Event, option: Element): void;
    /** Closes the list after a click outside it can be observed. */
    close(): void;
    #private;
}
import { BaseComponent } from '../core/core.js';
