/**
 * Tests for createApi (ADR-0021): URL/header composition, CSRF injection, error hooks and
 * XHR-based uploads — all against stubbed fetch/XMLHttpRequest, no network.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApi } from '../../src/core/api.js';
import { HttpError } from '../../src/core/fetch.js';

const jsonResponse = (body, status = 200, statusText = 'OK') =>
  new Response(JSON.stringify(body), { status, statusText, headers: { 'Content-Type': 'application/json' } });

/** Stubs globalThis.fetch, recording calls. @returns {{ calls: object[], restore: () => void }} */
function stubFetch(handler) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return handler(url, options);
  };
  return { calls, restore: () => { globalThis.fetch = original; } };
}

test('get joins baseUrl/path, appends params and sends AJAX headers without CSRF', async () => {
  const { calls, restore } = stubFetch(() => jsonResponse([1, 2]));
  try {
    const api = createApi({ baseUrl: '/api/v1/', csrfToken: 'token-123' });
    const result = await api.get('/posts', { page: 1, q: 'ada', skip: null });
    assert.deepEqual(result, [1, 2]);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, '/api/v1/posts?page=1&q=ada');
    assert.equal(calls[0].options.method, 'GET');
    assert.equal(calls[0].options.credentials, 'same-origin');
    assert.equal(calls[0].options.headers.get('X-Requested-With'), 'XMLHttpRequest');
    assert.equal(calls[0].options.headers.get('Accept'), 'application/json');
    assert.equal(calls[0].options.headers.get('X-CSRF-TOKEN'), null);
  } finally {
    restore();
  }
});

test('post JSON-encodes plain bodies and injects the CSRF header on unsafe methods', async () => {
  const { calls, restore } = stubFetch(() => jsonResponse({ id: 7 }, 201, 'Created'));
  try {
    const api = createApi({ baseUrl: '/api', csrfToken: 'token-123' });
    await api.post('posts', { title: 'Merhaba' });
    assert.equal(calls[0].url, '/api/posts');
    assert.equal(calls[0].options.headers.get('Content-Type'), 'application/json');
    assert.equal(calls[0].options.headers.get('X-CSRF-TOKEN'), 'token-123');
    assert.equal(calls[0].options.body, JSON.stringify({ title: 'Merhaba' }));
  } finally {
    restore();
  }
});

test('FormData bodies pass through unencoded; per-call headers override defaults', async () => {
  const { calls, restore } = stubFetch(() => jsonResponse({ ok: true }));
  try {
    const api = createApi({ baseUrl: '', csrfToken: 't', headers: { 'X-App': 'demo' } });
    const formData = new FormData();
    formData.set('title', 'x');
    await api.post('/posts', formData, { headers: { 'X-App': 'override' } });
    assert.equal(calls[0].options.body, formData);
    assert.equal(calls[0].options.headers.get('Content-Type'), null);
    assert.equal(calls[0].options.headers.get('X-App'), 'override');
  } finally {
    restore();
  }
});

test('HTTP failures throw HttpError with the parsed body and fire onError', async () => {
  const errors = [];
  const { restore } = stubFetch(() => jsonResponse({ errors: { title: 'Required' } }, 422, 'Unprocessable'));
  try {
    const api = createApi({ baseUrl: '/api', onError: (error) => errors.push(error) });
    await assert.rejects(api.post('/posts', {}), (error) => {
      assert.ok(error instanceof HttpError);
      assert.equal(error.status, 422);
      assert.equal(error.body.errors.title, 'Required');
      return true;
    });
    assert.equal(errors.length, 1);
  } finally {
    restore();
  }
});

test('401 fires onUnauthorized (other statuses do not) before the error propagates', async () => {
  const events = [];
  const { restore } = stubFetch((url) => (
    url.includes('me') ? jsonResponse({ error: 'Unauthorized' }, 401, 'Unauthorized') : jsonResponse({}, 500, 'Err')
  ));
  try {
    const api = createApi({ baseUrl: '/api', onUnauthorized: () => events.push('401') });
    await assert.rejects(api.get('/me'));
    await assert.rejects(api.get('/broken'));
    assert.deepEqual(events, ['401']);
  } finally {
    restore();
  }
});

/** Minimal XHR stub: instances are recorded and driven manually by the test. */
class FakeXHR {
  static instances = [];
  constructor() {
    this.headers = {};
    this.upload = {};
    FakeXHR.instances.push(this);
  }
  open(method, url) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(name, value) {
    this.headers[name] = value;
  }
  send(body) {
    this.body = body;
  }
  abort() {
    this.onabort?.();
  }
}

test('upload posts FormData via XHR, reports progress and resolves the parsed body', async () => {
  const original = globalThis.XMLHttpRequest;
  globalThis.XMLHttpRequest = FakeXHR;
  try {
    const api = createApi({ baseUrl: '/api', csrfToken: 'tok' });
    const progress = [];
    const formData = new FormData();
    const promise = api.upload('/media/upload', formData, { onProgress: (ratio) => progress.push(ratio) });
    const xhr = FakeXHR.instances.at(-1);
    assert.equal(xhr.method, 'POST');
    assert.equal(xhr.url, '/api/media/upload');
    assert.equal(xhr.headers['x-csrf-token'], 'tok'); // Headers normalizes names to lowercase
    assert.equal(xhr.body, formData);
    xhr.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 });
    xhr.status = 200;
    xhr.responseText = JSON.stringify({ id: 9 });
    xhr.onload();
    assert.deepEqual(await promise, { id: 9 });
    assert.deepEqual(progress, [0.5]);
  } finally {
    globalThis.XMLHttpRequest = original;
  }
});

test('upload rejects with HttpError on HTTP failure and honors abort signals', async () => {
  const original = globalThis.XMLHttpRequest;
  globalThis.XMLHttpRequest = FakeXHR;
  try {
    const api = createApi({ baseUrl: '/api' });
    const failing = api.upload('/media', new FormData());
    const xhr = FakeXHR.instances.at(-1);
    xhr.status = 413;
    xhr.statusText = 'Too Large';
    xhr.responseText = 'not json';
    xhr.onload();
    await assert.rejects(failing, (error) => {
      assert.ok(error instanceof HttpError);
      assert.equal(error.status, 413);
      assert.equal(error.body, null);
      return true;
    });

    const controller = new AbortController();
    const aborted = api.upload('/media', new FormData(), { signal: controller.signal });
    controller.abort();
    await assert.rejects(aborted, (error) => error.name === 'AbortError');

    const preAborted = api.upload('/media', new FormData(), { signal: controller.signal });
    await assert.rejects(preAborted, (error) => error.name === 'AbortError');
  } finally {
    globalThis.XMLHttpRequest = original;
  }
});
