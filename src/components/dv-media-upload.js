/** @module components/dv-media-upload - Drag & drop file uploads with progress and previews. */

import { BaseComponent, html, define } from '../core/core.js';
import { createApi } from '../core/api.js';
import { t, registerLocales, onLocaleChange } from '../core/i18n.js';
import locales from './dv-media-upload.locale.js';

registerLocales('dv-media-upload', locales);

/** @type {number} Monotonic id source for keyed list entries (ADR-0014). */
let nextId = 0;

/**
 * @param {File} file - Candidate file.
 * @param {string} accept - The accept token list, e.g. `'image/*,.pdf'`.
 * @returns {boolean} True when the file matches at least one token.
 */
function matchesAccept(file, accept) {
  return accept.split(',').map((token) => token.trim()).filter(Boolean).some((token) => {
    if (token.endsWith('/*')) return file.type.startsWith(token.slice(0, -1));
    if (token.startsWith('.')) return file.name.toLowerCase().endsWith(token.toLowerCase());
    return file.type === token;
  });
}

/**
 * @param {number} bytes - File size in bytes.
 * @returns {string} Human-readable size label.
 */
function formatSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Media upload widget: a drop zone plus a file list with thumbnails, per-file progress and
 * abort. Client-side validation mirrors the CI4 endpoint's rules (`data-accept`,
 * `data-max-size`) so bad files never leave the browser; the server remains the authority.
 *
 * Configuration (`data-*`): `endpoint` (required), `accept`, `max-size` (bytes, 0 = unlimited),
 * `multiple`, `auto` (upload immediately, default true), `name` (form field, default `file`),
 * `csrf-token` (default: `<meta name="csrf-token">`).
 *
 * Events: `dv:added` ({ files }), `dv:uploaded` ({ name, response }), `dv:error`
 * ({ name, reason }), `dv:remove` ({ name }).
 */
export class DvMediaUpload extends BaseComponent {
  /** @type {ReturnType<typeof createApi> | null} Lazily created API client. */
  #api = null;

  /** @returns {{ files: object[], dragging: boolean }} Initial state. */
  initialState() {
    return { files: [], dragging: false };
  }

  /** Subscribes to locale changes and registers the abort-all disconnect cleanup. */
  connected() {
    this.onCleanup(onLocaleChange(() => this.requestUpdate()));
    this.onCleanup(() => {
      for (const entry of this.state.files) entry.controller?.abort();
    });
  }

  /**
   * Adds files from an input change or a drop. Invalid files are rejected with a `dv:error`
   * event (never uploaded); in single-file mode the list is replaced. With `data-auto`
   * (default) each accepted file uploads immediately.
   *
   * @param {FileList | File[]} fileList - Files to add.
   * @returns {void}
   */
  addFiles(fileList) {
    const incoming = Array.from(fileList ?? []);
    if (incoming.length === 0) return;
    const multiple = this.bool('multiple', false);
    const accepted = [];
    for (const file of incoming.slice(0, multiple ? incoming.length : 1)) {
      const problem = this.#validateFile(file);
      if (problem) {
        this.emit('error', { name: file.name, reason: problem });
        continue;
      }
      accepted.push(file);
    }
    if (!multiple) this.state.files = [];
    const added = [];
    for (const file of accepted) {
      this.state.files.push({
        id: ++nextId,
        file,
        name: file.name,
        size: file.size,
        preview: '',
        progress: 0,
        status: 'queued',
        error: '',
        controller: null,
        response: null,
      });
      const entry = this.state.files[this.state.files.length - 1];
      added.push(entry);
      this.#readPreview(entry);
      if (this.bool('auto', true)) this.upload(entry);
    }
    if (added.length > 0) this.emit('added', { files: added.map((entry) => entry.name) });
  }

  /**
   * Uploads one queued entry via XHR with progress (createApi). **Transport seam:** override
   * this method to customize the upload (chunking, a different driver, test doubles).
   *
   * @param {object} entry - A live entry from `state.files`.
   * @returns {Promise<void>} Resolves when the entry reaches a terminal status.
   */
  async upload(entry) {
    entry.status = 'uploading';
    entry.progress = 0;
    const controller = new AbortController();
    entry.controller = controller;
    const formData = new FormData();
    formData.append(this.str('name', 'file'), entry.file, entry.name);
    try {
      const response = await this.#client().upload(this.str('endpoint'), formData, {
        signal: controller.signal,
        onProgress: (ratio) => {
          entry.progress = ratio;
        },
      });
      entry.status = 'done';
      entry.progress = 1;
      entry.response = response;
      this.emit('uploaded', { name: entry.name, response });
    } catch (error) {
      if (error?.name === 'AbortError') {
        entry.status = 'queued'; // back to queued: startAll() can retry it
        entry.progress = 0;
        return;
      }
      entry.status = 'error';
      entry.error = error?.body?.message || error?.message || 'Upload failed.';
      this.emit('error', { name: entry.name, reason: entry.error });
    }
  }

  /** Opens the native file picker (drop zone click / keyboard). @returns {void} */
  openPicker() {
    /** @type {HTMLInputElement | null} */
    const input = this.querySelector('input[type="file"]');
    input?.click();
  }

  /**
   * Keyboard access for the drop zone: Enter or Space opens the picker.
   *
   * @param {KeyboardEvent} event - Keydown event.
   * @returns {void}
   */
  onZoneKey(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.openPicker();
  }

  /**
   * @param {Event} _event - Change event (unused; the input carries the files).
   * @param {HTMLInputElement} input - The hidden file input.
   * @returns {void}
   */
  onPick(_event, input) {
    this.addFiles(input.files);
    input.value = ''; // allow picking the same file twice in a row
  }

  /** @returns {void} */
  onDragOver() {
    this.state.dragging = true;
  }

  /** @returns {void} */
  onDragLeave() {
    this.state.dragging = false;
  }

  /**
   * @param {DragEvent} event - Drop event (default already prevented by the directive).
   * @returns {void}
   */
  onDrop(event) {
    this.state.dragging = false;
    this.addFiles(event.dataTransfer?.files);
  }

  /** Uploads every queued entry (used when `data-auto="false"`). @returns {void} */
  startAll() {
    for (const entry of this.state.files) {
      if (entry.status === 'queued') this.upload(entry);
    }
  }

  /**
   * Aborts an in-flight upload; the entry returns to `queued` so it can be retried.
   *
   * @param {Event} _event - Click event (unused; the button carries `data-id`).
   * @param {Element} el - The abort button carrying `data-id`.
   * @returns {void}
   */
  abortFile(_event, el) {
    this.#find(el)?.controller?.abort();
  }

  /**
   * Removes an entry (aborting its upload first when in flight).
   *
   * @param {Event} _event - Click event (unused; the button carries `data-id`).
   * @param {Element} el - The remove button carrying `data-id`.
   * @returns {void}
   */
  removeFile(_event, el) {
    const entry = this.#find(el);
    if (!entry) return;
    entry.controller?.abort();
    this.state.files = this.state.files.filter((candidate) => candidate.id !== entry.id);
    this.emit('remove', { name: entry.name });
  }


  /** @returns {import('../core/html.js').HtmlString} Upload widget markup. */
  template() {
    return html`
    <div class="dv-upload" data-dragging="${String(this.state.dragging)}">
      <div class="dv-upload__zone" role="button" tabindex="0" aria-label="${t(this, 'label', 'Drop files here or browse')}" data-on:click="openPicker" data-on:keydown="onZoneKey" data-on:dragover:prevent="onDragOver" data-on:dragleave="onDragLeave" data-on:drop:prevent="onDrop">
        <p>${t(this, 'label', 'Drop files here or browse')}</p>
      </div>
      <input type="file" hidden multiple="${this.bool('multiple', false)}" accept="${this.str('accept')}" data-on:change="onPick">
      <ul class="dv-upload__list">${this.state.files.map((entry) => html`
        <li class="dv-upload__item" data-key="${entry.id}" data-status="${entry.status}">
          ${entry.preview ? html`<img class="dv-upload__thumb" src="${entry.preview}" alt="">` : ''}
          <span class="dv-upload__name">${entry.name}</span>
          <span class="dv-upload__size">${formatSize(entry.size)}</span>
          ${entry.status === 'uploading' ? html`<progress max="1" value="${entry.progress}" aria-label="${entry.name}"></progress><button type="button" data-on:click="abortFile" data-id="${entry.id}">${t(this, 'abortLabel', 'Abort')}</button>` : ''}
          ${entry.status === 'error' ? html`<p role="alert">${entry.error}</p>` : ''}
          <button type="button" data-on:click="removeFile" data-id="${entry.id}" aria-label="${t(this, 'removeLabel', 'Remove')}">×</button>
        </li>`)}
      </ul>
      ${this.state.files.some((entry) => entry.status === 'queued') && !this.bool('auto', true) ? html`<button type="button" class="dv-upload__start" data-on:click="startAll">${t(this, 'uploadLabel', 'Upload')}</button>` : ''}
    </div>`;
  }

  /**
   * The API client, created once. `data-csrf-token` overrides the meta-tag default.
   *
   * @returns {ReturnType<typeof createApi>} The upload client.
   */
  #client() {
    if (!this.#api) {
      const token = this.str('csrfToken', '');
      this.#api = createApi(token ? { csrfToken: token } : {});
    }
    return this.#api;
  }

  /**
   * @param {File} file - Candidate file.
   * @returns {string | null} A localized rejection message, or null when the file passes.
   */
  #validateFile(file) {
    const accept = this.str('accept', '').trim();
    if (accept && !matchesAccept(file, accept)) {
      return t(this, 'invalidType', 'This file type is not allowed.');
    }
    const maxSize = this.num('maxSize', 0);
    if (maxSize > 0 && file.size > maxSize) {
      return t(this, 'tooLarge', 'File exceeds the {max} KB limit.', { max: Math.round(maxSize / 1024) });
    }
    return null;
  }

  /**
   * Reads a data-URL thumbnail for image files; failures leave the entry preview-less.
   *
   * @param {object} entry - A live entry from `state.files`.
   * @returns {void}
   */
  #readPreview(entry) {
    if (!entry.file.type.startsWith('image/')) return;
    try {
      const reader = new FileReader();
      reader.onload = () => {
        entry.preview = String(reader.result ?? '');
      };
      reader.readAsDataURL(entry.file);
    } catch {
      // No FileReader (or a read failure): the name/size row still renders.
    }
  }

  /**
   * @param {Element} el - A button carrying `data-id`.
   * @returns {object | undefined} The matching live entry.
   */
  #find(el) {
    const id = Number(el.getAttribute('data-id'));
    return this.state.files.find((entry) => entry.id === id);
  }
}

define('dv-media-upload', DvMediaUpload);
