import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createForm } from '../../src/core/form.js';

test('form tracks values, errors and dirty state', () => {
  const form = createForm({ email: 'ada@example.test' });
  form.set('email', 'grace@example.test');
  form.setErrors({ email: 'Already registered' });

  assert.equal(form.state.values.email, 'grace@example.test');
  assert.equal(form.state.dirty, true);
  assert.equal(form.state.status, 'error');
  assert.equal(form.state.errors.email, 'Already registered');

  form.set('email', 'new@example.test');
  assert.equal(form.state.errors.email, undefined);
});

test('form submission exposes success and maps API validation errors', async () => {
  const form = createForm({ name: 'Ada' });
  const result = await form.submit(async (values) => ({ id: 1, ...values }));
  assert.deepEqual(result, { id: 1, name: 'Ada' });
  assert.equal(form.state.status, 'success');
  assert.equal(form.state.dirty, false);

  const error = Object.assign(new Error('Invalid'), { body: { errors: { name: 'Required' } } });
  await assert.rejects(form.submit(async () => { throw error; }), error);
  assert.equal(form.state.status, 'error');
  assert.equal(form.state.errors.name, 'Required');
});

test('form reset restores initial values', () => {
  const form = createForm({ count: 1 });
  form.set('count', 2);
  form.reset();
  assert.deepEqual(form.state.values, { count: 1 });
  assert.equal(form.state.dirty, false);
  assert.equal(form.state.status, 'idle');
});
