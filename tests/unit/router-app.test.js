/**
 * Tests for the ADR-0023 router additions: trailing wildcards, guards (block/redirect/async),
 * lazy targets, mount() element rendering and bindRouterLinks() declarative navigation.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window({ url: 'https://example.test/#/' });
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'MouseEvent', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

const { createHashRouter, bindRouterLinks } = await import('../../src/core/router.js');
const { BaseComponent, html, define } = await import('../../src/core/core.js');

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('trailing wildcard captures the remaining path segments', () => {
  const local = new Window({ url: 'https://example.test/#/admin/settings/seo' });
  const router = createHashRouter(local).add('/admin/*', 'admin');
  router.start();
  assert.deepEqual(router.current(), {
    path: '/admin/settings/seo',
    params: { wildcard: 'settings/seo' },
    target: 'admin',
  });

  local.location.hash = '/admin';
  return new Promise((resolve) => setTimeout(() => {
    assert.equal(router.current().params.wildcard, '');
    resolve();
  }, 0));
});

test('beforeEnter can block navigation; the current route stays put', async () => {
  const local = new Window({ url: 'https://example.test/#/' });
  const router = createHashRouter(local)
    .add('/', 'home')
    .add('/secret', 'secret', { beforeEnter: () => false });
  router.start();
  assert.equal(router.current()?.target, 'home');

  router.navigate('/secret');
  await settle();
  assert.equal(router.current()?.target, 'home'); // blocked — still home
});

test('guards run in order (global before per-route) and a string verdict redirects', async () => {
  const order = [];
  const local = new Window({ url: 'https://example.test/#/' });
  const router = createHashRouter(local)
    .add('/', 'home')
    .add('/login', 'login')
    .add('/admin', 'admin', { beforeEnter: () => { order.push('route'); return '/login'; } });
  router.beforeEach(() => { order.push('global'); });
  router.start();
  await settle();

  router.navigate('/admin');
  await settle();
  await settle();
  // global runs for the initial '/', again for '/admin' (then route guard), and once more for
  // the '/login' redirect — proving global guards wrap every navigation, per-route last.
  assert.deepEqual(order, ['global', 'global', 'route', 'global']);
  assert.equal(router.current()?.target, 'login');
});

test('async guards are awaited before the route dispatches', async () => {
  const local = new Window({ url: 'https://example.test/#/' });
  const router = createHashRouter(local)
    .add('/', 'home')
    .add('/slow', 'slow', {
      beforeEnter: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return true;
      },
    });
  router.start();
  router.navigate('/slow');
  assert.equal(router.current()?.target, 'home'); // not yet — guard pending
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(router.current()?.target, 'slow');
});

test('lazy targets are called once, awaited, unwrapped from .default and cached', async () => {
  const local = new Window({ url: 'https://example.test/#/' });
  let loads = 0;
  const router = createHashRouter(local)
    .add('/', 'home')
    .add('/lazy', async () => {
      loads += 1;
      return { default: 'dv-lazy-page' };
    });
  router.start();
  router.navigate('/lazy');
  await settle();
  await settle();
  assert.equal(router.current()?.target, 'dv-lazy-page');

  router.navigate('/');
  await settle();
  router.navigate('/lazy');
  await settle();
  await settle();
  assert.equal(loads, 1); // cached after first resolution
});

test('mount renders the matched tag, passes params as data-param-* and swaps elements', async () => {
  class DvPagePost extends BaseComponent {
    template() {
      return html`<p>post ${this.str('paramId', '?')}</p>`;
    }
  }
  define('dv-page-post', DvPagePost);
  class DvPageHome extends BaseComponent {
    template() {
      return html`<p>home</p>`;
    }
  }
  define('dv-page-home', DvPageHome);

  document.body.innerHTML = '';
  window.location.hash = '/';
  const router = createHashRouter(window) // same realm as define()d elements — required by mount
    .add('/', 'dv-page-home')
    .add('/posts/:id', 'dv-page-post');
  const container = document.createElement('div');
  document.body.appendChild(container);
  const dispose = router.mount(container);
  router.start();

  assert.equal(container.querySelector('dv-page-home')?.textContent.trim(), 'home');

  router.navigate('/posts/7');
  await settle();
  const first = container.querySelector('dv-page-post');
  assert.equal(first?.getAttribute('data-param-id'), '7');
  assert.equal(first?.textContent.trim(), 'post 7');

  router.navigate('/posts/8'); // same tag → updated in place, element identity kept
  await settle();
  const second = container.querySelector('dv-page-post');
  assert.equal(second, first);
  assert.equal(second?.getAttribute('data-param-id'), '8');

  router.navigate('/'); // different tag → replaced
  await settle();
  assert.ok(container.querySelector('dv-page-home'));
  assert.equal(container.querySelector('dv-page-post'), null);

  window.location.hash = '/nowhere'; // unmatched → container cleared
  await settle();
  assert.equal(container.childElementCount, 0);

  dispose();
  container.remove();
  router.stop();
});

test('mount accepts a route map and resolves define()d constructors to their tag', async () => {
  class DvMapPage extends BaseComponent {
    template() {
      return html`<span>mapped</span>`;
    }
  }
  define('dv-map-page', DvMapPage);

  document.body.innerHTML = '';
  window.location.hash = '/mapped';
  const router = createHashRouter(window);
  const container = document.createElement('div');
  document.body.appendChild(container);
  const dispose = router.mount(container, { '/mapped': DvMapPage });
  router.start();
  await settle();
  assert.equal(container.querySelector('dv-map-page')?.textContent.trim(), 'mapped');
  dispose();
  container.remove();
  router.stop();
});

test('bindRouterLinks routes a[dv-link] clicks and ignores modified or external clicks', async () => {
  document.body.innerHTML = '';
  window.location.hash = '/';
  const router = createHashRouter(window).add('/', 'home').add('/about', 'about');
  router.start();
  const unbind = bindRouterLinks(router, document);

  document.body.innerHTML = '<a id="nav" dv-link="/about">About</a><a id="ext" dv-link="/about" target="_blank">New tab</a>';
  const nav = document.getElementById('nav');
  nav.dispatchEvent(new window.MouseEvent('click', { bubbles: true, button: 0 }));
  await settle();
  assert.equal(router.current()?.target, 'about');

  router.navigate('/');
  await settle();
  nav.dispatchEvent(new window.MouseEvent('click', { bubbles: true, button: 0, ctrlKey: true }));
  await settle();
  assert.equal(router.current()?.target, 'home'); // ctrl+click keeps native behavior

  document.getElementById('ext').dispatchEvent(new window.MouseEvent('click', { bubbles: true, button: 0 }));
  await settle();
  assert.equal(router.current()?.target, 'home'); // target=_blank opts out

  unbind();
  nav.dispatchEvent(new window.MouseEvent('click', { bubbles: true, button: 0 }));
  await settle();
  assert.equal(router.current()?.target, 'home'); // unbound
  document.body.innerHTML = '';
});
