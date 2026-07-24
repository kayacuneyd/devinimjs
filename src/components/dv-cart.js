/** @module components/dv-cart - A presentational cart with page-owned data. */
import { BaseComponent, html, define } from '../core/core.js';
import { t, registerLocales, onLocaleChange } from '../core/i18n.js';
import locales from './dv-cart.locale.js';

registerLocales('dv-cart', locales);

/** Cart view that accepts JSON items or `setItems()` from an application store. */
export class DvCart extends BaseComponent {
  /** @returns {string[]} Live attributes. */
  static observedAttributes = ['data-items'];

  /** @returns {{ items: Array<{ id: string, name: string, price: number, quantity: number }> }} Initial state. */
  initialState() { return { items: this.#items() }; }

  /** Subscribes to active-locale changes (ADR-0019). */
  connected() { this.onCleanup(onLocaleChange(() => this.requestUpdate())); }

  /** @param {string} name - Attribute name. */
  onAttribute(name) { if (name === 'data-items') this.setItems(this.#items()); }

  /** @param {Array<{ id: string, name: string, price: number, quantity?: number }>} items - New cart items. */
  setItems(items) { this.state.items = Array.isArray(items) ? items.map((item) => ({ ...item, quantity: Math.max(1, Number(item.quantity) || 1) })) : []; }

  /**
   * @param {Event} _event - Click event.
   * @param {Element} button - Item button.
   */
  changeQuantity(_event, button) {
    const id = button.getAttribute('data-id');
    const amount = Number(button.getAttribute('data-amount')) || 0;
    const item = this.state.items.find((entry) => entry.id === id);
    if (!item) return;
    item.quantity += amount;
    if (item.quantity <= 0) this.removeItem(id);
    else this.emit('change', { items: this.items, total: this.total });
  }

  /**
   * @param {Event} _event - Click event.
   * @param {Element} button - Remove button.
   */
  removeButton(_event, button) { this.removeItem(button.getAttribute('data-id')); }

  /**
   * Named `removeItem`, not `remove` — `remove` would shadow the native
   * `Element.prototype.remove()` every custom element inherits.
   * @param {string | null} id - Item id.
   */
  removeItem(id) {
    this.state.items = this.state.items.filter((item) => item.id !== id);
    this.emit('remove', { id });
    this.emit('change', { items: this.items, total: this.total });
  }

  /** @returns {Array<{ id: string, name: string, price: number, quantity: number }>} Current items. */
  get items() { return this.state.items.map((item) => ({ ...item })); }
  /** @returns {number} Current total. */
  get total() { return this.state.items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0); }

  /** @returns {import('../core/html.js').HtmlString} Cart markup. */
  template() {
    if (!this.state.items.length) return html`<section class="dv-cart"><p>${t(this, 'empty', 'Your cart is empty.')}</p></section>`;
    return html`<section class="dv-cart" aria-label="${t(this, 'label', 'Cart')}"><ul>${this.state.items.map((item) => html`<li><span>${item.name}</span><span>${item.price}</span><button type="button" aria-label="${t(this, 'decreaseLabel', 'Decrease {name}', { name: item.name })}" data-id="${item.id}" data-amount="-1" data-on:click="changeQuantity">−</button><output aria-label="${t(this, 'quantityLabel', '{name} quantity', { name: item.name })}">${item.quantity}</output><button type="button" aria-label="${t(this, 'increaseLabel', 'Increase {name}', { name: item.name })}" data-id="${item.id}" data-amount="1" data-on:click="changeQuantity">+</button><button type="button" data-id="${item.id}" data-on:click="removeButton">${t(this, 'removeLabel', 'Remove')}</button></li>`)}</ul><p><strong>${t(this, 'totalLabel', 'Total')}: ${this.total}</strong></p></section>`;
  }

  /** @returns {Array<{ id: string, name: string, price: number, quantity: number }>} Parsed items. */
  #items() {
    const items = this.json('items', []);
    return Array.isArray(items) ? items.filter((item) => item && typeof item === 'object').map((item) => ({ id: String(item.id ?? ''), name: String(item.name ?? 'Product'), price: Number(item.price) || 0, quantity: Math.max(1, Number(item.quantity) || 1) })).filter((item) => item.id) : [];
  }
}

define('dv-cart', DvCart);
