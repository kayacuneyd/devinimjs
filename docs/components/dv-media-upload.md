# `dv-media-upload`

Drag & drop media uploader (roadmap §1.9 / §2.6) for the CI4 media endpoint: drop zone with
click/keyboard browse, client-side `accept`/`max-size` validation, thumbnail previews,
per-file XHR progress and abort. The server stays the validation authority — client rules
only spare round trips.

Source: [../../src/components/dv-media-upload.js](../../src/components/dv-media-upload.js).

## Usage

```html
<dv-media-upload
  data-endpoint="/api/media/upload"
  data-accept="image/*,video/*"
  data-max-size="5242880"
  data-multiple="true">
</dv-media-upload>
```

## Attributes

| Attribute | Default | Purpose |
|---|---|---|
| `data-endpoint` | — (required) | Upload URL; receives one `POST` multipart request per file. |
| `data-accept` | — (any) | Accept tokens: `image/*`, exact MIME or `.ext`. |
| `data-max-size` | `0` (unlimited) | Per-file size limit in bytes. |
| `data-multiple` | `false` | Allow several files; single-file mode replaces the entry. |
| `data-auto` | `true` | Upload on add; `false` shows an Upload button (`startAll()`). |
| `data-name` | `file` | Multipart field name the CI4 controller reads. |
| `data-csrf-token` | meta tag | CSRF override; defaults to `<meta name="csrf-token">`. |
| `data-label`, `data-upload-label`, `data-remove-label`, `data-abort-label`, `data-invalid-type`, `data-too-large` | locale bundle | Copy overrides (ADR-0019, `{max}` placeholder in KB). |

## Events

| Event | Detail | When |
|---|---|---|
| `dv:added` | `{ files: string[] }` | Files passed validation and entered the list. |
| `dv:uploaded` | `{ name, response }` | One file finished; `response` is the parsed CI4 JSON. |
| `dv:error` | `{ name, reason }` | Client-side rejection or a failed upload. |
| `dv:remove` | `{ name }` | An entry was removed (in-flight upload aborted first). |

## Methods

- `addFiles(fileList)` — add `File`s programmatically (input change and drop call this).
- `startAll()` — upload every queued entry (for `data-auto="false"`).
- `upload(entry)` — the transport seam: override to customize (chunked upload, test doubles).
- `removeFile(event, el)` / `abortFile(event, el)` — row actions wired by `data-on:click`.

In-flight uploads abort automatically when the element leaves the document (ADR lifecycle
cleanup). List rows carry `data-key`, so re-renders reuse nodes via the keyed morph (ADR-0014).
