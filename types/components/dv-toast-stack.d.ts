/** A multi-message live region with explicit and timed dismissal. */
export class DvToastStack extends BaseComponent {
    /**
     * @returns {{ items: Array<{ id: number, message: string, leaving: boolean }> }} Initial
     * state. `leaving` (ADR-0018) keeps a dismissed item mounted through its exit transition
     * instead of the array-splice removing it from the DOM the instant `dismiss()` runs.
     */
    initialState(): {
        items: Array<{
            id: number;
            message: string;
            leaving: boolean;
        }>;
    };
    /**
     * @param {string} message - Message text.
     * @returns {number} Message id.
     */
    show(message: string): number;
    /**
     * Marks the item as leaving (keeping it mounted for its exit transition) and emits `dv:hide`
     * immediately — both unchanged in timing from before this primitive existed (ADR-0018).
     * Removal from `state.items` itself is deferred until the item's exit transition (or the
     * primitive's timeout fallback) resolves.
     *
     * @param {number | string} id - Message id.
     */
    dismiss(id: number | string): void;
    /**
     * @param {Event} _event - Click event.
     * @param {Element} button - Dismiss button.
     */
    dismissButton(_event: Event, button: Element): void;
    #private;
}
import { BaseComponent } from '../core/core.js';
