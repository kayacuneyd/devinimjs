import { component, html } from './authoring.min.js';

component('dv-doc-counter', {
  props: { start: 4, step: 2 },
  state() { return { count: this.props.start }; },
  sync: { start(value) { this.state.count = value; } },
  actions: {
    increment() {
      this.state.count += this.props.step;
      this.emit('change', { count: this.state.count });
    },
  },
  view() {
    return html`<button type="button" class="ck-button" on:click="increment">Count ${this.state.count}</button>`;
  },
});
