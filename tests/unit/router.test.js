import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { createHashRouter } from '../../src/core/router.js';

test('hash router matches static and parameterized paths', () => {
  const window = new Window({ url: 'https://example.test/#/orders/42' });
  const router = createHashRouter(window)
    .add('/', 'home')
    .add('/orders/:id', 'order');
  const seen = [];
  router.subscribe((route) => seen.push(route));
  router.start();

  assert.deepEqual(router.current(), { path: '/orders/42', params: { id: '42' }, target: 'order' });
  assert.equal(seen.length, 1);
});

test('hash router navigates, decodes parameters and can stop listening', async () => {
  const window = new Window({ url: 'https://example.test/#/' });
  const router = createHashRouter(window).add('/users/:name', 'user');
  router.start();
  router.navigate('/users/Ada%20Lovelace');
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(router.current(), {
    path: '/users/Ada%20Lovelace',
    params: { name: 'Ada Lovelace' },
    target: 'user',
  });
  router.stop();
  window.location.hash = '/users/Grace';
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(router.current().params.name, 'Ada Lovelace');
});
