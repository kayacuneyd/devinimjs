/** @module components/dv-search - AI-first search field with a bubbling query event. */

import { component, html } from '../core/authoring.js';

/** @type {CustomElementConstructor} Search input configured through typed data-* props. */
export const DvSearch = component('dv-search', {
  props: { query: '', label: 'Search', placeholder: 'Search' },

  state() {
    return { query: this.props.query };
  },

  sync: {
    query(value) {
      this.state.query = value;
    },
  },

  actions: {
    onInput(_event, el) {
      this.state.query = el.value;
      this.emit('query', { query: this.state.query });
    },

    clear() {
      if (!this.state.query) return;
      this.state.query = '';
      this.emit('query', { query: '' });
    },
  },

  view() {
    return html`<div class="dv-search"><label>${this.props.label}<input type="search" value="${this.state.query}" placeholder="${this.props.placeholder}" on:input="onInput"></label><button type="button" on:click="clear" disabled="${!this.state.query}">Clear</button></div>`;
  },
});
