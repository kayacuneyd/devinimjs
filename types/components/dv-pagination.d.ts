/** Pagination component using one-based pages and a bubbling `dv:page` event. */
export class DvPagination extends BaseComponent {
    /** @returns {string[]} Live-synced attributes. */
    static observedAttributes: string[];
    /** @returns {{ page: number, total: number, size: number }} Initial pagination state. */
    initialState(): {
        page: number;
        total: number;
        size: number;
    };
    /**
     * @param {string} name - Changed attribute.
     * @param {string | null} newValue - New value.
     */
    onAttribute(name: string, newValue: string | null): void;
    /**
     * @param {Event} _event - Triggering event.
     * @param {Element} el - Button carrying page index.
     */
    goToButton(_event: Event, el: Element): void;
    /**
     * Reads the jump-to-page input and navigates there. Invalid text (e.g. `"abc"`) and
     * out-of-range numbers are clamped by `goTo`/`#clamp` exactly like any other `goTo` call — no
     * separate validation is needed here, and a bad value can never crash or emit an out-of-range
     * page.
     *
     * @param {Event} event - Form submit event (from the jump-to-page control).
     * @param {Element} el - The `<form>` carrying the jump input.
     */
    jumpToPage(event: Event, el: Element): void;
    /** @param {number} page - Requested one-based page. */
    goTo(page: number): void;
    #private;
}
import { BaseComponent } from '../core/core.js';
