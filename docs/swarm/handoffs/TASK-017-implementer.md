# TASK-017 implementer handoff

## Status

Implementation completed; verification is blocked by the site’s remaining axe contrast
violation.

## Scope delivered

Added `tests/e2e/site-next.spec.js` without changing the site implementation or existing
tests. The new suite covers:

- Critical English routes under `/site-next/`.
- Critical Turkish routes under `/site-next/tr/`.
- `console` errors and uncaught `pageerror` failures for every route.
- Mobile (`390x844`) and desktop (`1440x900`) horizontal-overflow checks for every critical route.
- Homepage `dv-counter` increment and `dv-search` query event behavior.
- Component catalog filtering through the real `dv-search` event and `hidden` card state.
- axe-core WCAG 2A/2AA scans for the homepage and component catalog.

The route checks assert a visible `main` and exactly one `h1`, with route-specific failure
messages. The interaction and overflow checks also include route/context in their assertions.

## Verification evidence

New-site suite command:

```text
npx playwright test tests/e2e/site-next.spec.js
```

Result:

```text
5 passed, 2 failed
```

The route, responsive, interaction and catalog-filter checks passed. Both failures are the
homepage and component-catalog axe checks.

Full E2E command:

```text
npm run test:e2e
```

Result:

```text
28 passed, 2 failed (34.1s)
```

The two failures are the new site axe checks; the 22 pre-existing checks and the other six
new-site checks passed.

## Open questions / follow-up

- The temporary `color-contrast` exclusion was removed. The axe assertion now fails on all
  WCAG A/AA violations as required.
- Both new-site axe checks currently report the primary button as a `color-contrast`
  violation: foreground `#18263b` on background `#075985`, measured at `2.01:1` where
  `4.5:1` is required for normal text. The failing nodes are the homepage “Start building”
  link and the component catalog “Home” link.
- TASK-012’s contrast correction is therefore not reflected in the CSS actually loaded by
  these pages (the pages currently load the pinned CKCSS CDN stylesheet). Resolve that
  integration/source mismatch, then rerun both commands above; no test exclusion should be
  reintroduced.
- The E2E suite verifies document-level overflow, not visual screenshot diffs. A future
  visual-regression task can add approved desktop/mobile snapshots if that becomes part
  of the project’s browser quality gate.

## Files

- `tests/e2e/site-next.spec.js`
- `docs/swarm/handoffs/TASK-017-implementer.md`
