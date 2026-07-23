/** Toggleable menu that preserves consumer-provided menu content. */
export class DvDropdown extends BaseComponent {
    /** @returns {string[]} Live attributes. */ static observedAttributes: string[];
    /** @returns {{ open: boolean }} Initial state. */ initialState(): {
        open: boolean;
    };
    /**
     * @param {string} name - Attribute.
     * @param {string | null} value - Value.
     */
    onAttribute(name: string, value: string | null): void;
    /** Toggles the menu. */
    toggle(): void;
    /** @param {KeyboardEvent} event - Key event. */
    onKeydown(event: KeyboardEvent): void;
}
import { BaseComponent } from '../core/core.js';
