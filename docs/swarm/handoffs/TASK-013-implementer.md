# TASK-013 handoff — homepage and component catalog

## Completed

- Replaced the homepage's native counter placeholder with the shipped `dv-counter` custom element.
- Added a real `dv-search` example to the homepage; both demos load local files from `dist/modules/`.
- Added live accessible outputs for `dv:change` and `dv:query`.
- Rebuilt the component catalog around real shipped elements: counter, tabs, disclosure, field, autocomplete, data table, product card/cart, state/toast stack and modal.
- Documented supported `data-*` inputs, visible state, and observed `dv:*` events next to each live example.
- Added catalog filtering through the real `dv-search` event contract.
- Kept page-local behavior in `site-next/assets/js/site-home-demo.js` and `site-next/assets/js/site-components-demo.js`.

## Evidence

Commands and checks run from the repository root:

- `node --check site-next/assets/js/site-home-demo.js`
- `node --check site-next/assets/js/site-components-demo.js`
- `npx eslint site-next/assets/js/site-home-demo.js site-next/assets/js/site-components-demo.js`
- Started `node scripts/serve.mjs --port 4173` and verified HTTP 200 for `/site-next/`, `/site-next/components/`, and `/dist/modules/dv-counter.js`.
- Playwright smoke check loaded both pages with no page or console errors. It verified counter changes, homepage query events, catalog filtering, modal `dv:open`/`dv:close`, and state `dv:retry`.

## API alignment

- Component modules are imported from the current local distribution under `dist/modules/`.
- Examples use documented `data-*` configuration and bubbling `dv:*` events.
- The modal demo calls its current public `open(event, opener)` method so open/close events and focus behavior are exercised correctly.
- The data table demo uses page-provided JSON and its current filter/sort/page events; it does not claim to fetch remote data.
- The cart demo treats cart items as page-owned state and responds to the current product/cart events.

## Open questions

- The catalog currently remains English; translation work is outside TASK-013.
- The page still references the shared CKCSS CDN stylesheet and shared site shell files owned by other tasks.
- A future task may add dedicated catalog styling or a machine-generated API manifest, but no unsupported component or editor behavior is claimed here.
