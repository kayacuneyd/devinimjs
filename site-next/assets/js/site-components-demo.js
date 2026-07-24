/* global document, navigator, window, MutationObserver */

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

const icon = (name) => {
  const paths = {
    code: '<path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="1"/><path d="M15 9V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h4"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
  };
  return `<svg class="dv-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
};

const copyText = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.className = 'ck-visually-hidden';
  document.body.append(area);
  area.select();
  document.execCommand('copy');
  area.remove();
};

document.querySelectorAll('[data-component-item]').forEach((card) => {
  card.querySelector(':scope > h2 + p')?.classList.add('dv-component-contract');
  card.querySelector(':scope > output')?.classList.add('dv-component-event');

  const demoNodes = [...card.children].filter((node) => node.tagName.startsWith('DV-') || node.id === 'open-catalog-modal');
  if (demoNodes.length) {
    const demo = document.createElement('div');
    demo.className = 'dv-component-demo';
    demoNodes[0].before(demo);
    demoNodes.forEach((node) => demo.append(node));
  }

  const source = card.querySelector(':scope > code');
  if (!source) return;
  const block = document.createElement('section');
  block.className = 'dv-code-block';
  const tools = document.createElement('div');
  tools.className = 'dv-code-tools';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'ck-button ck-button--secondary dv-code-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = `${icon('code')}<span>Usage code</span>`;
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'ck-button ck-button--secondary dv-code-copy';
  copy.innerHTML = `${icon('copy')}<span>Copy</span>`;
  const pre = document.createElement('pre');
  pre.hidden = true;
  pre.tabIndex = 0;
  source.before(block);
  pre.append(source);
  tools.append(toggle, copy);
  block.append(tools, pre);

  toggle.addEventListener('click', () => {
    const open = pre.hidden;
    pre.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('span').textContent = open ? 'Hide code' : 'Usage code';
  });
  copy.addEventListener('click', async () => {
    try {
      await copyText(source.textContent);
      copy.querySelector('span').textContent = 'Copied';
      window.setTimeout(() => { copy.querySelector('span').textContent = 'Copy'; }, 1600);
    } catch {
      copy.querySelector('span').textContent = 'Copy failed';
    }
  });
});

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
const decorateModalClose = () => {
  const close = modal?.querySelector('.dv-modal header button');
  if (!close || close.dataset.catalogIcon === 'true') return;
  close.dataset.catalogIcon = 'true';
  close.innerHTML = `${icon('close')}<span class="ck-visually-hidden">Close</span>`;
};
if (modal) {
  new MutationObserver(decorateModalClose).observe(modal, { childList: true, subtree: true });
  decorateModalClose();
}
document.querySelector('#open-catalog-modal')?.addEventListener('click', (event) => modal?.open(event, event.currentTarget));
modal?.addEventListener('dv:open', () => { output('modal-event', 'dv:open → modal is open.'); write('Modal emitted dv:open.'); });
modal?.addEventListener('dv:close', () => { output('modal-event', 'dv:close → modal is closed.'); write('Modal emitted dv:close.'); });
