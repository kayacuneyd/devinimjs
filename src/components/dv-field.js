/** @module components/dv-field - Configurable form field with native validation. */
import { BaseComponent, html, define } from '../core/core.js';

/** A labelled native control that reports its value and validity without owning submission. */
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
   * @param {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement} input - Field control.
   */
  onInput(event, input) {
    this.state.value = input.value;
    this.state.invalid = !input.validity.valid;
    this.emit('input', { value: input.value, valid: input.validity.valid, originalEvent: event });
  }

  /**
   * @param {Event} event - Change event.
   * @param {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement} input - Field control.
   */
  onChange(event, input) {
    this.state.invalid = !input.validity.valid;
    this.emit('change', { value: input.value, valid: input.validity.valid, originalEvent: event });
  }

  /** @returns {import('../core/html.js').HtmlString} Field markup. */
  template() {
    const id = this.str('id', this.str('name', 'field'));
    const control = this.str('control', 'input');
    const options = this.#options();
    const input = control === 'textarea'
      ? html`<textarea id="${id}" name="${this.str('name')}" required="${this.bool('required', false)}" disabled="${this.bool('disabled', false)}" aria-invalid="${String(this.state.invalid)}" data-on:input="onInput" data-on:change="onChange" placeholder="${this.str('placeholder')}">${this.state.value}</textarea>`
      : control === 'select'
        ? html`<select id="${id}" name="${this.str('name')}" required="${this.bool('required', false)}" disabled="${this.bool('disabled', false)}" aria-invalid="${String(this.state.invalid)}" data-on:input="onInput" data-on:change="onChange">${options.map((option) => html`<option value="${option.value}" selected="${option.value === this.state.value}">${option.label}</option>`)}</select>`
        : html`<input id="${id}" name="${this.str('name')}" required="${this.bool('required', false)}" disabled="${this.bool('disabled', false)}" aria-invalid="${String(this.state.invalid)}" data-on:input="onInput" data-on:change="onChange" type="${this.str('type', 'text')}" value="${this.state.value}" placeholder="${this.str('placeholder')}">`;
    return html`<div class="dv-field"><label for="${id}">${this.str('label', 'Field')}</label>${input}<p hidden=${!this.state.invalid} role="alert">${this.str('error', 'Please enter a valid value.')}</p></div>`;
  }

  /** @returns {Array<{ value: string, label: string }>} Parsed select options. */
  #options() {
    const options = this.json('options', []);
    return Array.isArray(options) ? options.map((option) => typeof option === 'string' ? { value: option, label: option } : { value: String(option?.value ?? ''), label: String(option?.label ?? option?.value ?? '') }) : [];
  }
}

define('dv-field', DvField);
