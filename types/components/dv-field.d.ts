/** A labelled native control that reports its value and validity without owning submission. */
export class DvField extends BaseComponent {
    /** @returns {string[]} Live attributes. */
    static observedAttributes: string[];
    /** @returns {{ value: string, invalid: boolean }} Initial state. */
    initialState(): {
        value: string;
        invalid: boolean;
    };
    /**
     * @param {string} name - Attribute.
     * @param {string | null} value - New attribute value.
     */
    onAttribute(name: string, value: string | null): void;
    /**
     * @param {Event} event - Input event.
     * @param {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement} input - Field control.
     */
    onInput(event: Event, input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): void;
    /**
     * @param {Event} event - Change event.
     * @param {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement} input - Field control.
     */
    onChange(event: Event, input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): void;
    #private;
}
import { BaseComponent } from '../core/core.js';
