/* global document, window */

const nav = document.querySelector('.dv-nav');
let navToggle = document.querySelector('.dv-nav-toggle');

if (nav && !navToggle) {
  navToggle = document.createElement('button');
  navToggle.className = 'ck-button ck-button--secondary dv-nav-toggle';
  navToggle.type = 'button';
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-controls', nav.id || 'primary-nav');
  navToggle.textContent = document.documentElement.lang === 'tr' ? 'Menü' : 'Menu';
  nav.parentElement.insertBefore(navToggle, nav);
}

nav?.classList.remove('dv-nav--static');

if (navToggle && nav) {
  const navLinks = [...nav.querySelectorAll('a')];

  const closeNav = ({ returnFocus = false } = {}) => {
    navToggle.setAttribute('aria-expanded', 'false');
    nav.setAttribute('data-open', 'false');
    if (returnFocus) navToggle.focus();
  };

  const openNav = () => {
    navToggle.setAttribute('aria-expanded', 'true');
    nav.setAttribute('data-open', 'true');
    navLinks[0]?.focus();
  };

  navToggle.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') === 'true';
    if (open) closeNav({ returnFocus: true });
    else openNav();
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeNav();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
      closeNav({ returnFocus: true });
    }
  });

  document.addEventListener('click', (event) => {
    if (navToggle.getAttribute('aria-expanded') !== 'true') return;
    if (!nav.contains(event.target) && !navToggle.contains(event.target)) closeNav();
  });

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 48rem)').matches) closeNav();
  }, { passive: true });
}

const counter = document.querySelector('[data-counter-value]');
let value = Number(counter?.textContent ?? 0);
document.querySelectorAll('[data-counter]').forEach((button) => {
  button.addEventListener('click', () => {
    value += Number(button.getAttribute('data-counter') ?? 0);
    if (counter) counter.textContent = String(value);
  });
});
