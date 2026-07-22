/** @module components/dv-product-card - Product summary that emits an add-to-cart event. */
import { BaseComponent, html, define } from '../core/core.js';

/** Product card configured through data attributes. */
export class DvProductCard extends BaseComponent {
  /** @returns {{ id: string, name: string, price: number }} Initial product. */ initialState() { return { id: this.str('id'), name: this.str('name', 'Product'), price: this.num('price', 0) }; }
  /** Emits the configured product. */ add() { this.emit('add-to-cart', { ...this.state }); }
  /** @returns {import('../core/html.js').HtmlString} Markup. */ template() { return html`<article class="dv-product-card"><h3>${this.state.name}</h3><p>${this.state.price}</p><button type="button" data-on:click="add">${this.str('action', 'Add to cart')}</button></article>`; }
}
define('dv-product-card', DvProductCard);
