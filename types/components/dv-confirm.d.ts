/** Two-step confirmation button that leaves the action itself to the page. */
export class DvConfirm extends BaseComponent {
    /** @returns {{ pending: boolean }} Initial state. */
    initialState(): {
        pending: boolean;
    };
    /** Starts or completes the confirmation sequence. */
    proceed(): void;
    /** Cancels a pending confirmation. */
    cancel(): void;
}
import { BaseComponent } from '../core/core.js';
