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
    /** @param {number} page - Requested one-based page. */
    goTo(page: number): void;
    #private;
}
import { BaseComponent } from '../core/core.js';
