import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAsyncState } from '../../src/core/async-state.js';

test('async state exposes loading and success state', async () => {
  const resource = createAsyncState();
  const result = resource.run(Promise.resolve({ id: 1 }));
  assert.equal(resource.state.status, 'loading');
  assert.deepEqual(await result, { id: 1 });
  assert.equal(resource.state.status, 'success');
  assert.deepEqual(resource.state.data, { id: 1 });
});

test('a late response cannot overwrite newer async state', async () => {
  const resource = createAsyncState();
  let resolveFirst;
  const first = resource.run(new Promise((resolve) => { resolveFirst = resolve; }));
  const second = resource.run(Promise.resolve('new'));
  resolveFirst('old');

  await Promise.all([first, second]);
  assert.equal(resource.state.data, 'new');
  assert.equal(resource.state.status, 'success');
});

test('async state reports errors and reset cancels pending ownership', async () => {
  const resource = createAsyncState('seed');
  const failure = new Error('No network');
  await assert.rejects(resource.run(Promise.reject(failure)), failure);
  assert.equal(resource.state.status, 'error');
  assert.equal(resource.state.error, failure);

  resource.reset();
  assert.equal(resource.state.status, 'success');
  assert.equal(resource.state.data, 'seed');
  assert.equal(resource.state.error, null);
});
