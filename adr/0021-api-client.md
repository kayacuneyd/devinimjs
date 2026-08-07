# ADR-0021: JSON API client (`createApi`)

- **Status:** Accepted
- **Date:** 2026-08-07
- **Deciders:** Cüneyt Kaya
- **Constitution links:** §2.1 (YAGNI), §8 (security), §9.3 (budgets)
- **Fulfills:** roadmap (`devinimjs-yol-haritasi.md`) §1.8 / §2.1

## Context

The CMS roadmap requires a standard fetch layer: every request must carry the CI4 CSRF token,
the session cookie and an AJAX marker; 401s must route to login; errors must surface in one
place. `fetchJson` (ADR-0010 era) is a bare primitive with none of that, and uploads cannot
report progress over `fetch` at all.

## Decision drivers

- One client object created at bootstrap; components never hand-roll headers again.
- Build-free: no dependencies, plain ES module; stays out of the size-gated core barrel.
- XHR only where fetch is incapable (upload progress).

## Decision

1. **`createApi(config)`** (new `core/api.js`, exported via `core/app.js`) returns
   `{ request, get, delete, post, put, patch, upload }`. Config: `baseUrl`, `csrfToken`
   (default: `<meta name="csrf-token">` content), `csrfHeader` (default `X-CSRF-TOKEN`),
   `headers`, `credentials` (default `'same-origin'`), `onError`, `onUnauthorized`.
2. **CSRF:** the token header is attached to non-GET/HEAD/OPTIONS requests automatically.
   `X-Requested-With: XMLHttpRequest` is always sent (CI4's `$request->isAJAX()` contract).
3. **Bodies:** plain objects are JSON-encoded with a `Content-Type: application/json` header;
   `FormData` passes through untouched (browser sets the multipart boundary).
4. **Errors:** non-2xx responses reject with `HttpError` (status + parsed JSON `body`, so CI4
   `failValidationErrors()` arrives as `error.body.errors`). `onUnauthorized` fires on 401,
   `onError` on every failure — both before the rejection propagates.
5. **`upload(path, formData, { onProgress, signal })`** uses `XMLHttpRequest` (the only way to
   observe upload progress), wires the same headers/credentials, honors `AbortSignal` and maps
   failures onto the same `HttpError` shape.
6. **Query params:** `get(path, params)` skips null/undefined values.

## Considered alternatives (rejected)

- Extending `fetchJson` with options bags — every call site would repeat CSRF/credentials.
- A fetch-wrapper interceptor library — dependency and size against §8.4/§9.3.
- Upload progress via fetch streams — not usable for request upload progress in browsers.

## Consequences

**Positive:** one-line bootstrap per app; CSRF/session/401 handling is uniform; the CMS admin
shell and `dv-media-upload` share the transport.
**Negative / to manage:** XHR and fetch error paths must stay behaviorally aligned (covered by
`tests/unit/api.test.js`).
