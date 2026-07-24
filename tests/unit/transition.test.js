/**
 * Unit tests for the shared transition-timing primitive (ADR-0018): `awaitTransition(el)`.
 * happy-dom (used by this unit suite) never runs real CSS, so "a transition fired" is always
 * simulated by dispatching a synthetic `transitionend`/`animationend` event — real-browser
 * transition timing is covered separately in `tests/e2e/`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'document']) {
  globalThis[key] = window[key];
}

const { awaitTransition } = await import('../../src/core/transition.js');

/** @returns {number} High-resolution-ish timestamp for measuring elapsed test time. */
const now = () => Date.now();

test('resolves on a simulated transitionend fired on the element itself', async () => {
  const el = document.createElement('div');
  document.body.appendChild(el);

  const started = now();
  const pending = awaitTransition(el, { timeout: 5000 });
  el.dispatchEvent(new window.Event('transitionend', { bubbles: true }));
  await pending;
  assert.ok(now() - started < 1000, 'must resolve promptly on the event, not wait out the timeout');
});

test('resolves on a simulated animationend fired on the element itself', async () => {
  const el = document.createElement('div');
  document.body.appendChild(el);

  const started = now();
  const pending = awaitTransition(el, { timeout: 5000 });
  el.dispatchEvent(new window.Event('animationend', { bubbles: true }));
  await pending;
  assert.ok(now() - started < 1000, 'must resolve promptly on the event, not wait out the timeout');
});

test('ignores a transitionend bubbled up from a descendant — only the element\'s own transition counts', async () => {
  const el = document.createElement('div');
  const child = document.createElement('span');
  el.appendChild(child);
  document.body.appendChild(el);

  let resolved = false;
  awaitTransition(el, { timeout: 30 }).then(() => { resolved = true; });

  child.dispatchEvent(new window.Event('transitionend', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(resolved, false, "a descendant's transitionend must not resolve the parent's wait");

  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(resolved, true, 'the timeout fallback still resolves it eventually');
});

test('resolves via its timeout fallback when no transition/animation ever fires (no CSS defined)', async () => {
  const el = document.createElement('div');
  document.body.appendChild(el);

  let resolved = false;
  const started = now();
  awaitTransition(el, { timeout: 30 }).then(() => { resolved = true; });

  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(resolved, false, 'must not resolve before the timeout when nothing fires');

  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(resolved, true, 'must resolve via the timeout fallback so nothing hangs indefinitely');
  assert.ok(now() - started >= 30, 'the fallback must not fire before the configured timeout');
});

test('uses a 200ms default timeout when none is given', async () => {
  const el = document.createElement('div');
  document.body.appendChild(el);

  let resolved = false;
  awaitTransition(el).then(() => { resolved = true; });

  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.equal(resolved, false, 'the default timeout must not fire early');

  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(resolved, true, 'the default timeout must eventually resolve the promise');
});

test('settles exactly once even if both a real event and the timeout could apply', async () => {
  const el = document.createElement('div');
  document.body.appendChild(el);

  let resolveCount = 0;
  awaitTransition(el, { timeout: 20 }).then(() => { resolveCount += 1; });
  el.dispatchEvent(new window.Event('transitionend', { bubbles: true }));
  el.dispatchEvent(new window.Event('animationend', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(resolveCount, 1, 'a Promise settles once by construction, but this also proves no throw/duplicate work happens on redundant end events');
});
