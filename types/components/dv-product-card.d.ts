/**
 * Product card configured through data attributes.
 *
 * `name`'s `'Product'` fallback is deliberately left on `this.str()`, not wired through `t()`
 * (TASK-011 judgment call, see `dv-product-card.locale.js`'s header comment and the task
 * handoff): it's read once via `initialState()` as a generic placeholder for missing product
 * data, not UI chrome a human reads as copy in the same sense as the add-to-cart button label.
 */
export class DvProductCard extends BaseComponent {
    /** @returns {{ id: string, name: string, price: number }} Initial product. */ initialState(): {
        id: string;
        name: string;
        price: number;
    };
    /** Emits the configured product. */ add(): void;
}
import { BaseComponent } from '../core/core.js';
