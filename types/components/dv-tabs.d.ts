/**
 * Accessible tabbed interface.
 *
 * Attributes:
 * - `data-active` (number, default 0) — active tab index; live-synced (ADR-0005).
 * - `data-label` (string, default "Tabs") — accessible name of the tablist.
 *
 * Children: each child element becomes one tabpanel; its `data-tab` attribute is the tab
 * label (fallback: `Tab N`). The component manages `hidden`/ARIA on its panel children —
 * documented exception to "outlet content is consumer-owned".
 */
export class DvTabs extends BaseComponent {
    /** @returns {string[]} Live-synced attributes. */
    static observedAttributes: string[];
    /**
     * @returns {{ active: number, labels: string[] }} Initial state (active clamped to range).
     */
    initialState(): {
        active: number;
        labels: string[];
    };
    /**
     * Reflects live `data-active` changes (ADR-0005 #4).
     *
     * @param {string} name - Attribute name.
     * @param {string | null} newValue - New value.
     * @returns {void}
     */
    onAttribute(name: string, newValue: string | null): void;
    /**
     * Click handler for tabs (`data-on:click="activate"`).
     *
     * @param {Event} _event - DOM event (unused; index comes from the element).
     * @param {Element} el - The clicked tab button.
     * @returns {void}
     */
    activate(_event: Event, el: Element): void;
    /**
     * Keyboard navigation per APG: ArrowRight/ArrowLeft (wrapping), Home, End.
     *
     * @param {KeyboardEvent} event - The keydown event.
     * @returns {void}
     */
    onKeydown(event: KeyboardEvent): void;
    /**
     * Focus synchronization (APG automatic activation): a tab receiving focus becomes active.
     * Covers screen-reader virtual cursors and programmatic focus; loop-safe because
     * `activateIndex` no-ops on the current index.
     *
     * @param {Event} _event - DOM event (unused).
     * @param {Element} el - The focused tab button.
     * @returns {void}
     */
    onFocusin(_event: Event, el: Element): void;
    /**
     * Programmatic activation (clamped); emits `dv:tab` on change.
     *
     * @param {number} index - Target tab index.
     * @returns {void}
     */
    activateIndex(index: number): void;
    #private;
}
import { BaseComponent } from '../core/core.js';
