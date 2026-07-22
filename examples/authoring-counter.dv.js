import { component, html } from '../src/core/authoring.js';

component('acme-authoring-counter', {
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
  },

  view() {
    return html`
      <button type="button" on:click="increment">
        Count: ${this.state.count}
      </button>
    `;
  },
});
