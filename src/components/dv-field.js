/** @module components/dv-field - Configurable form field with native validation. */
import { BaseComponent, html, define } from '../core/core.js';

/** A labelled input that reports its value and validity without owning form submission. */
export class DvField extends BaseComponent {
  /** @returns {string[]} Live attributes. */
  static observedAttributes = ['data-value', 'data-required', 'data-disabled'];

  /** @returns {{ value: string, invalid: boolean }} Initial state. */
  initialState() { return { value: this.str('value'), invalid: false }; }

  /**
   * @param {string} name - Attribute.
   * @param {string | null} value - New attribute value.
   */
  onAttribute(name, value) {
    if (name === 'data-value') this.state.value = value ?? '';
  }

  /**
   * @param {Event} event - Input event.
   * @param {HTMLInputElement} input - Field input.
   */
  onInput(event, input) {
    this.state.value = input.value;
    this.state.invalid = !input.validity.valid;
    this.emit('input', { value: input.value, valid: input.validity.valid, originalEvent: event });
  }

  /**
   * @param {Event} event - Change event.
   * @param {HTMLInputElement} input - Field input.
   */
  onChange(event, input) {
    this.state.invalid = !input.validity.valid;
    this.emit('change', { value: input.value, valid: input.validity.valid, originalEvent: event });
  }

  /** @returns {import('../core/html.js').HtmlString} Field markup. */
  template() {
    const id = this.str('id', this.str('name', 'field'));
    return html`<div class="dv-field"><label for="${id}">${this.str('label', 'Field')}</label><input id="${id}" name="${this.str('name')}" type="${this.str('type', 'text')}" value="${this.state.value}" placeholder="${this.str('placeholder')}" required="${this.bool('required', false)}" disabled="${this.bool('disabled', false)}" aria-invalid="${String(this.state.invalid)}" data-on:input="onInput" data-on:change="onChange"><p hidden="${!this.state.invalid}" role="alert">${this.str('error', 'Please enter a valid value.')}</p></div>`;
  }
}

define('dv-field', DvField);
