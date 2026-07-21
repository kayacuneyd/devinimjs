/**
 * Unit tests for core/reactive.js — Proxy-based deep reactivity. DOM-free.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReactive } from '../../src/core/reactive.js';

test('setting a property notifies with its path', () => {
  const paths = [];
  const state = createReactive({ count: 0 }, (p) => paths.push(p));
  state.count = 5;
  assert.deepEqual(paths, ['count']);
  assert.equal(state.count, 5);
});

test('setting the same value does not notify', () => {
  const paths = [];
  const state = createReactive({ count: 1 }, (p) => paths.push(p));
  state.count = 1;
  assert.deepEqual(paths, []);
});

test('nested objects report dot paths', () => {
  const paths = [];
  const state = createReactive({ user: { name: 'a' } }, (p) => paths.push(p));
  state.user.name = 'b';
  assert.deepEqual(paths, ['user.name']);
});

test('arrays notify on push (index + length sets)', () => {
  const paths = [];
  const state = createReactive({ items: [] }, (p) => paths.push(p));
  state.items.push('x');
  assert.ok(paths.some((p) => p.startsWith('items')));
  assert.equal(state.items.length, 1);
});

test('deleteProperty notifies', () => {
  const paths = [];
  const state = createReactive({ a: 1 }, (p) => paths.push(p));
  delete state.a;
  assert.deepEqual(paths, ['a']);
});

test('class instances (Date) are passed through, not wrapped (documented limitation)', () => {
  const date = new Date(0);
  const state = createReactive({ date }, () => {});
  assert.ok(state.date instanceof Date);
  assert.equal(state.date.getTime(), 0);
});

test('proxy identity is stable for the same object within one state tree', () => {
  const state = createReactive({ user: { name: 'a' } }, () => {});
  assert.equal(state.user, state.user);
});
