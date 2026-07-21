import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchJson, HttpError } from '../../src/core/fetch.js';

test('fetchJson requests JSON and returns a parsed successful body', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.get('Accept'), 'application/json');
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  try {
    assert.deepEqual(await fetchJson('/api/items'), { ok: true });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchJson exposes JSON error payloads through HttpError', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'Invalid' }), {
    status: 422,
    statusText: 'Unprocessable Content',
  });

  try {
    await assert.rejects(fetchJson('/api/items'), (error) => {
      assert.ok(error instanceof HttpError);
      assert.equal(error.status, 422);
      assert.deepEqual(error.body, { message: 'Invalid' });
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchJson returns null for a no-content response', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 204 });
  try {
    assert.equal(await fetchJson('/api/items'), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
