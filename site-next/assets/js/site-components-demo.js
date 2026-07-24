/* global document */

import '../../../dist/modules/dv-search.js';
import '../../../dist/modules/dv-counter.js';
import '../../../dist/modules/dv-tabs.js';
import '../../../dist/modules/dv-disclosure.js';
import '../../../dist/modules/dv-field.js';
import '../../../dist/modules/dv-autocomplete.js';
import '../../../dist/modules/dv-data-table.js';
import '../../../dist/modules/dv-product-card.js';
import '../../../dist/modules/dv-cart.js';
import '../../../dist/modules/dv-state.js';
import '../../../dist/modules/dv-toast-stack.js';
import '../../../dist/modules/dv-modal.js';

const log = document.querySelector('#catalog-event-log');
const write = (message) => { if (log) log.textContent = message; };
const output = (id, message) => { const element = document.querySelector(`#${id}`); if (element) element.textContent = message; };

document.querySelector('#catalog-search')?.addEventListener('dv:query', (event) => {
  const query = event.detail.query.trim().toLowerCase();
  let visible = 0;
  document.querySelectorAll('[data-component-item]').forEach((card) => {
    const matches = !query || card.dataset.componentName.includes(query);
    card.hidden = !matches;
    if (matches) visible += 1;
  });
  write(`dv:query received. Showing ${visible} component${visible === 1 ? '' : 's'}.`);
});

document.querySelector('#catalog-counter')?.addEventListener('dv:change', (event) => {
  output('counter-event', `dv:change → count: ${event.detail.count}`);
  write('Counter emitted dv:change.');
});
document.querySelector('#catalog-tabs')?.addEventListener('dv:tab', (event) => {
  output('tabs-event', `dv:tab → active index: ${event.detail.index}`);
  write('Tabs emitted dv:tab.');
});
document.querySelector('#catalog-disclosure')?.addEventListener('dv:toggle', (event) => {
  output('disclosure-event', `dv:toggle → open: ${event.detail.open}`);
  write('Disclosure emitted dv:toggle.');
});
document.querySelector('#catalog-field')?.addEventListener('dv:input', (event) => {
  output('field-event', `dv:input → valid: ${event.detail.valid}`);
  write('Field emitted dv:input.');
});
document.querySelector('#catalog-autocomplete')?.addEventListener('dv:select', (event) => {
  output('autocomplete-event', `dv:select → value: ${event.detail.value}`);
  write('Autocomplete emitted dv:select.');
});

const table = document.querySelector('#catalog-table');
['dv:filter', 'dv:sort', 'dv:page'].forEach((eventName) => table?.addEventListener(eventName, (event) => {
  const detail = Object.entries(event.detail).map(([key, value]) => `${key}: ${value}`).join(', ');
  output('table-event', `${eventName} → ${detail}`);
  write(`Data table emitted ${eventName}.`);
}));

const cart = document.querySelector('#catalog-cart');
document.querySelector('#catalog-product')?.addEventListener('dv:add-to-cart', (event) => {
  const item = { ...event.detail, quantity: 1 };
  cart?.setAttribute('data-items', JSON.stringify([item]));
  output('cart-event', `dv:add-to-cart → ${item.name}; quantity: 1`);
  write('Product card emitted dv:add-to-cart.');
});
cart?.addEventListener('dv:change', (event) => {
  output('cart-event', `dv:change → total: ${event.detail.total}; items: ${event.detail.items.length}`);
  write('Cart emitted dv:change.');
});
cart?.addEventListener('dv:remove', (event) => {
  output('cart-event', `dv:remove → id: ${event.detail.id}`);
  write('Cart emitted dv:remove.');
});

document.querySelector('#catalog-state')?.addEventListener('dv:retry', (event) => {
  event.currentTarget.setAttribute('data-state', 'empty');
  output('state-event', 'dv:retry → state changed to empty.');
  write('State emitted dv:retry.');
});
const toast = document.querySelector('#catalog-toast');
document.querySelector('#catalog-state')?.addEventListener('click', () => toast?.show('State inspected.'));

const modal = document.querySelector('#catalog-modal');
document.querySelector('#open-catalog-modal')?.addEventListener('click', (event) => modal?.open(event, event.currentTarget));
modal?.addEventListener('dv:open', () => { output('modal-event', 'dv:open → modal is open.'); write('Modal emitted dv:open.'); });
modal?.addEventListener('dv:close', () => { output('modal-event', 'dv:close → modal is closed.'); write('Modal emitted dv:close.'); });
