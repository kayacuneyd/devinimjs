/** Status toast for page-level or component-level feedback. */
export class DvToast extends BaseComponent {
    static observedAttributes: string[];
    /** @returns {{ open: boolean, message: string }} Initial toast state. */
    initialState(): {
        open: boolean;
        message: string;
    };
    /**
     * @param {string} name - Changed attribute.
     * @param {string | null} newValue - New value.
     */
    onAttribute(name: string, newValue: string | null): void;
    /**
     * Shows a message and restarts its auto-dismiss timer.
     * @param {string} message - Message text.
     */
    show(message: string): void;
    /** Hides the toast. */
    hide(): void;
    #private;
}
import { BaseComponent } from '../core/core.js';
