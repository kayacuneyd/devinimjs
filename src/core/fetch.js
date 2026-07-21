/** @module core/fetch - Tiny JSON request helper with useful HTTP failures. */

/** Error raised when a request completed with a non-success HTTP status. */
export class HttpError extends Error {
  /**
   * @param {Response} response - Failed response.
   * @param {*} body - Parsed JSON body, when available.
   */
  constructor(response, body = null) {
    super(`Request failed: ${response.status} ${response.statusText}`);
    this.name = 'HttpError';
    this.status = response.status;
    this.response = response;
    this.body = body;
  }
}

/**
 * Requests a JSON endpoint. It adds an `Accept: application/json` header without changing any
 * caller-provided headers and exposes JSON error bodies through `HttpError#body`.
 *
 * @param {RequestInfo | URL} url - Endpoint URL.
 * @param {RequestInit} [options] - Native fetch options.
 * @returns {Promise<*>} Parsed JSON response body, or null for 204 responses.
 */
export async function fetchJson(url, options = {}) {
  const headers = new Headers(options.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  const response = await fetch(url, { ...options, headers });
  if (response.status === 204) return null;

  const body = await response.json().catch(() => null);
  if (!response.ok) throw new HttpError(response, body);
  return body;
}
