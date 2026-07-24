# TASK-014 handoff

## Files changed

- `site-next/docs/index.html`
- `site-next/tutorials/index.html`
- `site-next/examples/index.html`
- `docs/swarm/handoffs/TASK-014-implementer.md`

No shared CSS/JS, other site pages, constitution, specifications or legacy site files were changed.

## Content checks

- Docs now starts with the build-free browser-module path and links to the repository’s authoring, application-runtime, PHP-integration, component-contract and architecture guides.
- Docs uses the current `component()` contract: `props`, `state`, `sync`, `actions`, `view`, `on:event`, `html` and `this.emit()`.
- Application helpers are named only where present in `src/core/app.js`: `createAsyncState`, `fetchJson`, `createForm` and `createHashRouter`; `createStore` is identified as a core primitive.
- Tutorials are ordered from a counter through state/events, browser persistence, forms, stores, async API data, CRUD composition, product/cart UI, hash routing and deployment.
- Examples separate client-only prototypes from backend-dependent production flows and explicitly identify browser storage as local rather than shared persistence.
- WYSIWYG editor work is marked planned. No unsupported editor component or API is presented as current.
- Production boundaries are stated: authentication, authorization, database, payments, uploads and persistence belong to the project/backend.
- Existing links to the separate site-next docs, tutorials and components pages remain relative; repository references use the canonical GitHub paths.

## Open questions

- Should the final public site expose repository-reference links on `main`, or should the release site point to a versioned tag once documentation versioning is established?
- Should the future tutorial implementation include runnable lesson files under a dedicated examples/tutorials directory, or remain content-only until the first learning demos are finalized?
- Which browser-storage policy should the tutorial eventually standardize on for client-only exercises: `localStorage` for simple values, `IndexedDB` for structured records, or both?
