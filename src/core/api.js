/**
 * @module core/api
 * JSON API client for DevinimJS applications (ADR-0021): base-URL joining, query params, CSRF
 * header injection, same-origin credentials and centralized error/401 hooks. Built on
 * {@link fetchJson}; file uploads use XMLHttpRequest because `fetch` cannot report upload
 * progress.
 *
 * Deliberately **not** re-exported from `core/core.js` — it is application-runtime surface,
 * imported directly or via `core/app.js`, mirroring the ADR-0019 i18n precedent (size budget).
 */

import { fetchJson, HttpError } from './fetch.js';

/** Methods that never carry a CSRF token or JSON body by default. */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * @returns {string | null} The CSRF token from `<meta name="csrf-token">`, when present.
 */
function defaultCsrfToken() {
  try {
    if (typeof document === 'undefined') return null;
    return document.querySelector('meta[name="csrf-token"]')?.content ?? null;
  } catch {
    return null;
  }
}

/**
 * Joins base URL and path with exactly one slash and appends query params, skipping
 * null/undefined values.
 *
 * @param {string} baseUrl - API base, e.g. `'/api/v1'` or a full origin URL.
 * @param {string} path - Request path, e.g. `'/posts'`.
 * @param {Record<string, *>} [params] - Query parameters.
 * @returns {string} The final URL.
 */
function buildUrl(baseUrl, path, params) {
  const base = String(baseUrl).replace(/\/+$/, '');
  const clean = String(path).replace(/^\/+/, '');
  const url = clean === '' ? base || '/' : `${base}/${clean}`;
  if (!params) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  if (!query) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${query}`;
}

/**
 * Composes request headers: caller defaults, `X-Requested-With` (marks AJAX for CI4), the CSRF
 * header on state-changing methods and a JSON content type for plain-object bodies. Per-call
 * `extra` headers always win.
 *
 * @param {string} method - Uppercase HTTP method.
 * @param {HeadersInit} defaults - Client-level default headers.
 * @param {HeadersInit | undefined} extra - Per-request headers.
 * @param {string | null} csrfToken - CSRF token to send on unsafe methods.
 * @param {string} csrfHeader - Header name carrying the token.
 * @param {*} body - Request body (FormData passes through without a content type).
 * @returns {Headers} The composed headers.
 */
function buildHeaders(method, defaults, extra, csrfToken, csrfHeader, body) {
  const headers = new Headers(defaults);
  if (!headers.has('X-Requested-With')) headers.set('X-Requested-With', 'XMLHttpRequest');
  if (csrfToken && !SAFE_METHODS.has(method) && !headers.has(csrfHeader)) {
    headers.set(csrfHeader, csrfToken);
  }
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && body !== null && !isForm && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (extra) new Headers(extra).forEach((value, name) => headers.set(name, value));
  return headers;
}

/** @returns {Error} A DOMException-style abort error. */
function abortError() {
  return new DOMException('The operation was aborted.', 'AbortError');
}


/**
 * Creates an API client. One instance per application, created once at bootstrap:
 *
 * @param {{
 *   baseUrl?: string,
 *   csrfToken?: string | null,
 *   csrfHeader?: string,
 *   headers?: HeadersInit,
 *   credentials?: RequestCredentials,
 *   onError?: ((error: unknown) => void) | null,
 *   onUnauthorized?: ((error: HttpError) => void) | null,
 * }} [config] - Client configuration. `csrfToken` defaults to the `<meta name="csrf-token">`
 *   content (CI4 layout convention); `credentials` defaults to `'same-origin'` so the CI4
 *   session cookie rides along. `onUnauthorized` fires on every 401 (e.g. redirect to login);
 *   `onError` fires on every failure — both run before the error is rethrown.
 * @returns {{ request: (method: string, path: string, options?: object) => Promise<*>, get: (path: string, params?: Record<string, *>, options?: object) => Promise<*>, delete: (path: string, options?: object) => Promise<*>, post: (path: string, body?: *, options?: object) => Promise<*>, put: (path: string, body?: *, options?: object) => Promise<*>, patch: (path: string, body?: *, options?: object) => Promise<*>, upload: (path: string, formData: FormData, options?: { onProgress?: (ratio: number, event: ProgressEvent) => void, signal?: AbortSignal, headers?: HeadersInit }) => Promise<*> }} The API client.
 *
 * @example
 * const api = createApi({
 *   baseUrl: '/api/v1',
 *   onError: (err) => showToast(err.message, 'error'),
 *   onUnauthorized: () => router.navigate('/login'),
 * });
 * const posts = await api.get('/posts', { page: 1 });
 * await api.post('/posts', { title: 'Merhaba' });
 */
export function createApi(config = {}) {
  const {
    baseUrl = '',
    csrfToken = defaultCsrfToken(),
    csrfHeader = 'X-CSRF-TOKEN',
    headers: defaultHeaders = {},
    credentials = 'same-origin',
    onError = null,
    onUnauthorized = null,
  } = config;

  /**
   * Performs one JSON request. Plain-object bodies are JSON-encoded; FormData passes through.
   *
   * @param {string} method - HTTP method.
   * @param {string} path - Request path appended to `baseUrl`.
   * @param {{ params?: Record<string, *>, body?: *, headers?: HeadersInit, signal?: AbortSignal }} [options] - Request options.
   * @returns {Promise<*>} Parsed JSON body.
   */
  async function request(method, path, { params, body, headers, signal } = {}) {
    const verb = method.toUpperCase();
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
    const payload = body === undefined || body === null || isForm ? body ?? undefined : JSON.stringify(body);
    try {
      return await fetchJson(buildUrl(baseUrl, path, params), {
        method: verb,
        headers: buildHeaders(verb, defaultHeaders, headers, csrfToken, csrfHeader, body),
        body: payload,
        credentials,
        signal,
      });
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) onUnauthorized?.(error);
      onError?.(error);
      throw error;
    }
  }

  /**
   * Uploads a FormData payload with real progress events (XHR). Rejections mirror `request`:
   * an {@link HttpError} on HTTP failure (with parsed JSON body when available), an AbortError
   * when `signal` aborts.
   *
   * @param {string} path - Upload endpoint appended to `baseUrl`.
   * @param {FormData} formData - Multipart payload.
   * @param {{ onProgress?: (ratio: number, event: ProgressEvent) => void, signal?: AbortSignal, headers?: HeadersInit }} [options] - Upload options.
   * @returns {Promise<*>} Parsed JSON response body.
   */
  function upload(path, formData, { onProgress, signal, headers } = {}) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', buildUrl(baseUrl, path));
      if (credentials === 'include') xhr.withCredentials = true;
      const finalHeaders = buildHeaders('POST', defaultHeaders, headers, csrfToken, csrfHeader, formData);
      finalHeaders.forEach((value, name) => xhr.setRequestHeader(name, value));

      if (signal) {
        if (signal.aborted) {
          reject(abortError());
          return;
        }
        signal.addEventListener('abort', () => xhr.abort(), { once: true });
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress?.(event.total === 0 ? 1 : event.loaded / event.total, event);
      };
      xhr.onload = () => {
        let parsed = null;
        try {
          parsed = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        } catch {
          parsed = null; // Non-JSON error page (proxy/PHP fatal) — body stays null.
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(parsed);
          return;
        }
        const error = new HttpError({ status: xhr.status, statusText: xhr.statusText }, parsed);
        if (xhr.status === 401) onUnauthorized?.(error);
        onError?.(error);
        reject(error);
      };
      xhr.onerror = () => {
        const error = new Error('[devinim] api upload failed: network error.');
        onError?.(error);
        reject(error);
      };
      xhr.onabort = () => reject(abortError());
      xhr.send(formData);
    });
  }

  return {
    request,
    get: (path, params, options = {}) => request('GET', path, { ...options, params }),
    delete: (path, options = {}) => request('DELETE', path, options),
    post: (path, body, options = {}) => request('POST', path, { ...options, body }),
    put: (path, body, options = {}) => request('PUT', path, { ...options, body }),
    patch: (path, body, options = {}) => request('PATCH', path, { ...options, body }),
    upload,
  };
}
