/** Accessible modal dialog: Escape to close, close-button, and a WAI-ARIA APG Tab focus trap. */
export class DvModal extends BaseComponent {
    /** @returns {string[]} Live-synced attributes. */
    static observedAttributes: string[];
    /** @returns {{ open: boolean }} Initial modal state. */
    initialState(): {
        open: boolean;
    };
    /**
     * @param {string} name - Changed attribute.
     * @param {string | null} newValue - New value.
     */
    onAttribute(name: string, newValue: string | null): void;
    /**
     * @param {Event} _event - Triggering event.
     * @param {Element} el - Opening control.
     */
    open(_event: Event, el: Element): void;
    /** Closes the dialog and restores focus to its recorded opener. */
    close(): void;
    /** @param {KeyboardEvent} event - Dialog key event. */
    onKeydown(event: KeyboardEvent): void;
    #private;
}
import { BaseComponent } from '../core/core.js';
