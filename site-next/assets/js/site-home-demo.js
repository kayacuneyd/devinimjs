/* global document */

import '../../../dist/modules/dv-counter.js';
import '../../../dist/modules/dv-search.js';

const counter = document.querySelector('#home-counter');
const counterResult = document.querySelector('#home-counter-result');
const search = document.querySelector('#home-search');
const searchResult = document.querySelector('#home-search-result');

counter?.addEventListener('dv:change', (event) => {
  counterResult.textContent = `Count is ${event.detail.count}. Event: dv:change.`;
});

search?.addEventListener('dv:query', (event) => {
  const query = event.detail.query || 'empty';
  searchResult.textContent = `Query event: ${query}.`;
});
