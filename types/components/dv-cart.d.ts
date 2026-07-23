/** Cart view that accepts JSON items or `setItems()` from an application store. */
export class DvCart extends BaseComponent {
    /** @returns {string[]} Live attributes. */
    static observedAttributes: string[];
    /** @returns {{ items: Array<{ id: string, name: string, price: number, quantity: number }> }} Initial state. */
    initialState(): {
        items: Array<{
            id: string;
            name: string;
            price: number;
            quantity: number;
        }>;
    };
    /** @param {string} name - Attribute name. */
    onAttribute(name: string): void;
    /** @param {Array<{ id: string, name: string, price: number, quantity?: number }>} items - New cart items. */
    setItems(items: Array<{
        id: string;
        name: string;
        price: number;
        quantity?: number;
    }>): void;
    /**
     * @param {Event} _event - Click event.
     * @param {Element} button - Item button.
     */
    changeQuantity(_event: Event, button: Element): void;
    /**
     * @param {Event} _event - Click event.
     * @param {Element} button - Remove button.
     */
    removeButton(_event: Event, button: Element): void;
    /** @param {string | null} id - Item id. */
    remove(id: string | null): void;
    /** @returns {Array<{ id: string, name: string, price: number, quantity: number }>} Current items. */
    get items(): Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
    }>;
    /** @returns {number} Current total. */
    get total(): number;
    #private;
}
import { BaseComponent } from '../core/core.js';
