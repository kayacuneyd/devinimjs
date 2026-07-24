/** @module components/dv-product-card - Product summary that emits an add-to-cart event. */
import { BaseComponent, html, define } from '../core/core.js';
import { t, registerLocales, onLocaleChange } from '../core/i18n.js';
import locales from './dv-product-card.locale.js';

registerLocales('dv-product-card', locales);

/**
 * Product card configured through data attributes.
 *
 * `name`'s `'Product'` fallback is deliberately left on `this.str()`, not wired through `t()`
 * (TASK-011 judgment call, see `dv-product-card.locale.js`'s header comment and the task
 * handoff): it's read once via `initialState()` as a generic placeholder for missing product
 * data, not UI chrome a human reads as copy in the same sense as the add-to-cart button label.
 */
export class DvProductCard extends BaseComponent {
  /** @returns {{ id: string, name: string, price: number }} Initial product. */ initialState() { return { id: this.str('id'), name: this.str('name', 'Product'), price: this.num('price', 0) }; }
  /** Subscribes to locale changes (ADR-0019). */ connected() { this.onCleanup(onLocaleChange(() => this.requestUpdate())); }
  /** Emits the configured product. */ add() { this.emit('add-to-cart', { ...this.state }); }
  /** @returns {import('../core/html.js').HtmlString} Markup. */ template() { return html`<article class="dv-product-card"><h3>${this.state.name}</h3><p>${this.state.price}</p><button type="button" data-on:click="add">${t(this, 'action', 'Add to cart')}</button></article>`; }
}
define('dv-product-card', DvProductCard);
