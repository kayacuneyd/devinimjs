/** A multi-message live region with explicit and timed dismissal. */
export class DvToastStack extends BaseComponent {
    /** @returns {{ items: Array<{ id: number, message: string }> }} Initial state. */
    initialState(): {
        items: Array<{
            id: number;
            message: string;
        }>;
    };
    /**
     * @param {string} message - Message text.
     * @returns {number} Message id.
     */
    show(message: string): number;
    /** @param {number | string} id - Message id. */
    dismiss(id: number | string): void;
    /**
     * @param {Event} _event - Click event.
     * @param {Element} button - Dismiss button.
     */
    dismissButton(_event: Event, button: Element): void;
    #private;
}
import { BaseComponent } from '../core/core.js';
