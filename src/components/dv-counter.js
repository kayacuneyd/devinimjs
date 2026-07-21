/**
 * @module components/dv-counter
 * `<dv-counter>` — the canonical DevinimJS example component (PROJECTIDEA deliverable).
 * A stepper fed by PHP-printed `data-*` attributes, emitting `dv:change`.
 *
 * @example PHP usage:
 * <dv-counter data-start="<?= (int)$start ?>" data-step="5"></dv-counter>
 * <script type="module" src="/assets/devinim/components/dv-counter.js"></script>
 *
 * @example Listening for changes:
 * document.querySelector('dv-counter').addEventListener('dv:change', (e) => {
 *   console.log(e.detail.count);
 * });
 */

import { BaseComponent, html, define } from '../core/core.js';

/**
 * An accessible counter with increment/decrement buttons.
 *
 * Attributes:
 * - `data-start` (number, default 0) — initial count.
 * - `data-step` (number, default 1) — increment/decrement step.
 *
 * Live changes to `data-start`/`data-step` are reflected into state via
 * {@link DvCounter#onAttribute} (ADR-0005).
 *
 * @fires CustomEvent#dv:change - After every count change; `detail: { count: number }`.
 */
export class DvCounter extends BaseComponent {
  /** @returns {string[]} Attributes synced into state after initialization. */
  static observedAttributes = ['data-start', 'data-step'];

  /**
   * @returns {{ count: number, step: number }} Initial state from `data-*` attributes.
   */
  initialState() {
    return {
      count: this.num('start', 0),
      step: this.num('step', 1),
    };
  }

  /**
   * Reflects live attribute changes into state (ADR-0005 #4).
   *
   * @param {string} name - Attribute name.
   * @param {string | null} newValue - New value.
   * @returns {void}
   */
  onAttribute(name, newValue) {
    if (name === 'data-start') this.state.count = Number(newValue) || 0;
    if (name === 'data-step') this.state.step = Number(newValue) || 1;
  }

  /**
   * Increments the count by step and emits `dv:change`.
   *
   * @returns {void}
   */
  increment() {
    this.state.count += this.state.step;
    this.emit('change', { count: this.state.count });
  }

  /**
   * Decrements the count by step and emits `dv:change`.
   *
   * @returns {void}
   */
  decrement() {
    this.state.count -= this.state.step;
    this.emit('change', { count: this.state.count });
  }

  /**
   * @returns {import('../core/html.js').HtmlString} The counter template.
   */
  template() {
    return html`
      <button type="button" data-on:click="decrement" aria-label="Decrease">−</button>
      <output aria-live="polite">${this.state.count}</output>
      <button type="button" data-on:click="increment" aria-label="Increase">+</button>
    `;
  }
}

define('dv-counter', DvCounter);
