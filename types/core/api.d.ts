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
export function createApi(config?: {
    baseUrl?: string;
    csrfToken?: string | null;
    csrfHeader?: string;
    headers?: HeadersInit;
    credentials?: RequestCredentials;
    onError?: ((error: unknown) => void) | null;
    onUnauthorized?: ((error: HttpError) => void) | null;
}): {
    request: (method: string, path: string, options?: object) => Promise<any>;
    get: (path: string, params?: Record<string, any>, options?: object) => Promise<any>;
    delete: (path: string, options?: object) => Promise<any>;
    post: (path: string, body?: any, options?: object) => Promise<any>;
    put: (path: string, body?: any, options?: object) => Promise<any>;
    patch: (path: string, body?: any, options?: object) => Promise<any>;
    upload: (path: string, formData: FormData, options?: {
        onProgress?: (ratio: number, event: ProgressEvent) => void;
        signal?: AbortSignal;
        headers?: HeadersInit;
    }) => Promise<any>;
};
import { HttpError } from './fetch.js';
