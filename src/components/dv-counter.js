/**
 * @module components/dv-counter
 * `<dv-counter>` — canonical AI-first component: PHP/data-* configuration, concise actions
 * and a bubbling `dv:change` event without a compiler.
 */

import { component, html } from '../core/authoring.js';

/**
 * An accessible counter with increment/decrement buttons.
 *
 * @type {CustomElementConstructor}
 */
export const DvCounter = component('dv-counter', {
  props: { start: 0, step: 1 },

  state() {
    return { count: this.props.start };
  },

  sync: {
    start(value) {
      this.state.count = value;
    },
  },

  actions: {
    increment() {
      this.state.count += this.props.step;
      this.emit('change', { count: this.state.count });
    },

    decrement() {
      this.state.count -= this.props.step;
      this.emit('change', { count: this.state.count });
    },
  },

  view() {
    return html`
      <button type="button" on:click="decrement" aria-label="Decrease">−</button>
      <output aria-live="polite">${this.state.count}</output>
      <button type="button" on:click="increment" aria-label="Increase">+</button>
    `;
  },
});
