/** Accessible disclosure component. */
export class DvDisclosure extends BaseComponent {
    /** @returns {string[]} Live-synced attributes. */
    static observedAttributes: string[];
    /** @returns {{ open: boolean }} Initial disclosure state. */
    initialState(): {
        open: boolean;
    };
    /**
     * @param {string} name - Changed attribute.
     * @param {string | null} newValue - New value.
     */
    onAttribute(name: string, newValue: string | null): void;
    /** Toggles content visibility and emits `dv:toggle`. */
    toggle(): void;
    #private;
}
import { BaseComponent } from '../core/core.js';
