/**
 * Requests a JSON endpoint. It adds an `Accept: application/json` header without changing any
 * caller-provided headers and exposes JSON error bodies through `HttpError#body`.
 *
 * @param {RequestInfo | URL} url - Endpoint URL.
 * @param {RequestInit} [options] - Native fetch options.
 * @returns {Promise<*>} Parsed JSON response body, or null for 204 responses.
 */
export function fetchJson(url: RequestInfo | URL, options?: RequestInit): Promise<any>;
/** @module core/fetch - Tiny JSON request helper with useful HTTP failures. */
/** Error raised when a request completed with a non-success HTTP status. */
export class HttpError extends Error {
    /**
     * @param {Response} response - Failed response.
     * @param {*} body - Parsed JSON body, when available.
     */
    constructor(response: Response, body?: any);
    status: number;
    response: Response;
    body: any;
}
