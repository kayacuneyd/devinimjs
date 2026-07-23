/** Product card configured through data attributes. */
export class DvProductCard extends BaseComponent {
    /** @returns {{ id: string, name: string, price: number }} Initial product. */ initialState(): {
        id: string;
        name: string;
        price: number;
    };
    /** Emits the configured product. */ add(): void;
}
import { BaseComponent } from '../core/core.js';
