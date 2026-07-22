const toast = document.querySelector('dv-toast');
const stack = document.querySelector('dv-toast-stack');

document.querySelectorAll('[data-demo-toast]').forEach((button) => {
  button.addEventListener('click', () => toast?.show(button.closest('article')?.querySelector('.ck-alert__title')?.textContent ?? 'Saved without a build step.'));
});

document.querySelectorAll('[data-open-modal]').forEach((button) => {
  button.addEventListener('click', (event) => {
    document.querySelector(button.dataset.openModal)?.open(event, button);
  });
});

document.querySelectorAll('[data-show-stack]').forEach((button) => {
  button.addEventListener('click', () => stack?.show('The page owns this notification queue.'));
});

const search = document.querySelector('#component-search');
search?.addEventListener('dv:query', (event) => {
  const query = String(event.detail.query ?? '').trim().toLowerCase();
  document.querySelectorAll('[data-component-item]').forEach((item) => {
    item.hidden = query !== '' && !item.dataset.componentName.toLowerCase().includes(query);
  });
});

document.querySelector('#catalog-product')?.addEventListener('dv:add-to-cart', (event) => {
  const result = document.querySelector('#cart-result');
  if (result) result.textContent = `${event.detail.name} added to the page-owned cart.`;
});

document.querySelector('#catalog-autocomplete')?.addEventListener('dv:select', (event) => {
  const result = document.querySelector('#autocomplete-result');
  if (result) result.textContent = `Selected: ${event.detail.value}`;
});

document.querySelector('#catalog-confirm')?.addEventListener('dv:confirm', (event) => {
  const result = document.querySelector('#form-result');
  if (result) result.textContent = `Confirmed: ${event.detail.value}`;
});
