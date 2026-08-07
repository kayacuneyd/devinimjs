/**
 * Tests for dv-media-upload (roadmap 1.9): client-side accept/size validation, single vs.
 * multiple mode, the auto-upload flow via the overridable transport seam, abort and remove.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';

const window = new Window();
for (const key of ['HTMLElement', 'Element', 'Node', 'CustomEvent', 'File', 'FileReader', 'FormData', 'AbortController', 'document', 'customElements']) {
  globalThis[key] = window[key];
}

await import('../../src/components/dv-media-upload.js');
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const image = (name = 'a.png', size = 10) => new File(['x'.repeat(size)], name, { type: 'image/png' });

/** Creates a mounted upload element with the transport seam stubbed. */
async function mount(attributes = {}, uploadImpl = null) {
  const el = document.createElement('dv-media-upload');
  el.setAttribute('data-endpoint', '/api/media/upload');
  for (const [key, value] of Object.entries(attributes)) el.setAttribute(`data-${key}`, value);
  el.upload = uploadImpl ?? (async (entry) => {
    entry.status = 'done';
    entry.progress = 1;
  });
  document.body.appendChild(el);
  await settle();
  return el;
}

test('renders the drop zone and the hidden file input', async () => {
  const el = await mount({ accept: 'image/*', multiple: 'true' });
  const zone = el.querySelector('.dv-upload__zone');
  assert.equal(zone?.getAttribute('role'), 'button');
  assert.equal(zone?.getAttribute('tabindex'), '0');
  const input = el.querySelector('input[type="file"]');
  assert.ok(input?.hidden);
  assert.equal(input?.getAttribute('accept'), 'image/*');
  assert.ok(input?.multiple);
  el.remove();
});

test('accepts a valid image and emits dv:added; auto upload marks it done', async () => {
  const el = await mount({ accept: 'image/*' });
  const events = [];
  el.addEventListener('dv:added', (event) => events.push(event.detail));
  el.addFiles([image('photo.png', 20)]);
  await settle();
  assert.deepEqual(events, [{ files: ['photo.png'] }]);
  const item = el.querySelector('.dv-upload__item');
  assert.equal(item?.getAttribute('data-status'), 'done');
  assert.match(item?.textContent, /photo\.png/);
  el.remove();
});

test('rejects a disallowed type with dv:error and never uploads', async () => {
  let uploads = 0;
  const el = await mount({ accept: 'image/*' }, async () => {
    uploads += 1;
  });
  const errors = [];
  el.addEventListener('dv:error', (event) => errors.push(event.detail));
  el.addFiles([new File(['x'], 'notes.txt', { type: 'text/plain' })]);
  await settle();
  assert.equal(uploads, 0);
  assert.equal(el.state.files.length, 0);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].name, 'notes.txt');
  assert.match(errors[0].reason, /not allowed/);
  el.remove();
});

test('rejects an oversize file with a localized max-size message', async () => {
  const el = await mount({ 'max-size': '1024' }, async () => {
    throw new Error('must not upload');
  });
  const errors = [];
  el.addEventListener('dv:error', (event) => errors.push(event.detail));
  el.addFiles([image('big.png', 2048)]);
  await settle();
  assert.equal(errors.length, 1);
  assert.match(errors[0].reason, /1 KB/);
  el.remove();
});

test('single-file mode replaces the previous entry; multiple mode appends', async () => {
  const single = await mount();
  single.addFiles([image('one.png')]);
  single.addFiles([image('two.png')]);
  await settle();
  assert.equal(single.state.files.length, 1);
  assert.equal(single.state.files[0].name, 'two.png');
  single.remove();

  const multi = await mount({ multiple: 'true' });
  multi.addFiles([image('one.png'), image('two.png')]);
  await settle();
  assert.equal(multi.state.files.length, 2);
  multi.remove();
});

/** XHR stub that never completes — instances stay in flight until aborted or driven manually. */
class PendingXHR {
  static instances = [];
  constructor() {
    this.upload = {};
    this.aborted = false;
    PendingXHR.instances.push(this);
  }
  open() {}
  setRequestHeader() {}
  send() {} // never completes
  abort() {
    this.aborted = true;
    this.onabort?.();
  }
}

/** Mounts an element with the REAL upload() transport and a stubbed XHR layer. */
async function mountRealTransport(attributes = {}) {
  const el = document.createElement('dv-media-upload');
  el.setAttribute('data-endpoint', '/api/media/upload');
  for (const [key, value] of Object.entries(attributes)) el.setAttribute(`data-${key}`, value);
  document.body.appendChild(el);
  await settle();
  return el;
}

test('data-auto="false" queues files until startAll; abort returns an entry to queued', async () => {
  const original = globalThis.XMLHttpRequest;
  globalThis.XMLHttpRequest = PendingXHR;
  try {
    const el = await mountRealTransport({ auto: 'false', multiple: 'true' });
    el.addFiles([image('one.png'), image('two.png')]);
    await settle();
    assert.deepEqual(el.state.files.map((entry) => entry.status), ['queued', 'queued']);
    assert.ok(el.querySelector('.dv-upload__start'));

    el.startAll();
    await settle();
    assert.deepEqual(el.state.files.map((entry) => entry.status), ['uploading', 'uploading']);

    el.abortFile(new Event('click'), { getAttribute: () => String(el.state.files[0].id) });
    await settle();
    assert.equal(el.state.files[0].status, 'queued');
    assert.equal(el.state.files[1].status, 'uploading');
    el.remove();
  } finally {
    globalThis.XMLHttpRequest = original;
  }
});

test('removeFile aborts and removes the entry, emitting dv:remove', async () => {
  const el = await mount();
  el.addFiles([image('gone.png')]);
  await settle();
  const removed = [];
  el.addEventListener('dv:remove', (event) => removed.push(event.detail));
  el.removeFile(new Event('click'), { getAttribute: () => String(el.state.files[0].id) });
  await settle();
  assert.equal(el.state.files.length, 0);
  assert.deepEqual(removed, [{ name: 'gone.png' }]);
  assert.equal(el.querySelector('.dv-upload__item'), null);
  el.remove();
});

test('a failed upload marks the entry and surfaces the server message', async () => {
  const el = await mount({}, async (entry) => {
    entry.status = 'error';
    entry.error = 'Geçersiz dosya';
  });
  el.addFiles([image('bad.png')]);
  await settle();
  await settle();
  const item = el.querySelector('.dv-upload__item');
  assert.equal(item?.getAttribute('data-status'), 'error');
  assert.match(item?.textContent, /Geçersiz dosya/);
  el.remove();
});

test('drop adds files and clears the dragging flag', async () => {
  const el = await mount({ multiple: 'true' });
  el.onDragOver();
  await settle();
  assert.equal(el.querySelector('.dv-upload')?.getAttribute('data-dragging'), 'true');
  const drop = new Event('drop');
  drop.dataTransfer = { files: [image('drop.png')] };
  el.onDrop(drop);
  await settle();
  assert.equal(el.querySelector('.dv-upload')?.getAttribute('data-dragging'), 'false');
  assert.equal(el.state.files.length, 1);
  el.remove();
});

/** XHR stub that fails every upload with a JSON 500 — drives the real upload() transport. */
class FailingXHR {
  constructor() {
    this.upload = {};
    globalThis.__lastXhr = this;
  }
  open() {}
  setRequestHeader() {}
  send() {
    this.status = 500;
    this.statusText = 'Server Error';
    this.responseText = JSON.stringify({ message: 'Sunucu hatası' });
    this.onload();
  }
  abort() {
    this.onabort?.();
  }
}

test('the real upload() transport maps an HTTP failure onto the entry state', async () => {
  const original = globalThis.XMLHttpRequest;
  globalThis.XMLHttpRequest = FailingXHR;
  const errors = [];
  try {
    const el = document.createElement('dv-media-upload');
    el.setAttribute('data-endpoint', '/api/media/upload');
    el.setAttribute('data-csrf-token', 'tok');
    el.addEventListener('dv:error', (event) => errors.push(event.detail));
    document.body.appendChild(el);
    await settle();
    el.addFiles([image('real.png')]); // no transport override — the real upload() runs
    await settle();
    await settle();
    assert.equal(el.state.files[0].status, 'error');
    assert.equal(el.state.files[0].error, 'Sunucu hatası');
    assert.deepEqual(errors, [{ name: 'real.png', reason: 'Sunucu hatası' }]);
    el.remove();
  } finally {
    globalThis.XMLHttpRequest = original;
  }
});

test('disconnect aborts in-flight uploads (lifecycle cleanup, roadmap 1.3)', async () => {
  const original = globalThis.XMLHttpRequest;
  globalThis.XMLHttpRequest = PendingXHR;
  try {
    const el = await mountRealTransport();
    el.addFiles([image('pending.png')]);
    await settle();
    assert.equal(el.state.files[0].status, 'uploading');
    const xhr = PendingXHR.instances.at(-1);
    el.remove();
    await settle();
    assert.equal(xhr.aborted, true);
  } finally {
    globalThis.XMLHttpRequest = original;
  }
});
