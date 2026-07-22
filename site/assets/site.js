import { createAsyncState, createForm, createHashRouter, fetchJson } from 'https://cdn.jsdelivr.net/gh/kayacuneyd/devinimjs@v0.2.0/dist/app.min.js';

const toast = document.querySelector('dv-toast');
document.querySelectorAll('[data-toast]').forEach((button) => {
  button.addEventListener('click', () => toast?.show(button.dataset.toast));
});

document.querySelectorAll('[data-open-modal]').forEach((button) => {
  button.addEventListener('click', (event) => {
    document.querySelector(button.dataset.openModal)?.open(event, button);
  });
});

// The helpers are exposed for the tutorial snippets on this static site.
window.devinim = { createAsyncState, createForm, createHashRouter, fetchJson };
