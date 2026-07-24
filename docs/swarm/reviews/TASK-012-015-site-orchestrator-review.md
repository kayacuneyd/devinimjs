# Review: TASK-012..015 — Public-site redesign round

## Status

Approved and merged to `main` after human maintainer approval. The four workstreams completed within their
exclusive ownership maps. No legacy `site/` files or DevinimJS library source files were changed.

## Evidence reviewed

- Handoffs for TASK-012, TASK-013, TASK-014 and TASK-015.
- Actual worktree file list and ownership boundaries.
- `git diff --check` — passed.
- `npm run lint` — passed.
- `npm test` — 223 unit tests passed.
- `npm run size` — 3352 B min+gzip / 4096 B budget, passed.
- `npm run test:e2e` — 23 Playwright tests passed.
- Custom Chromium smoke check against the new site:
  - homepage, component catalog, docs and Turkish homepage loaded without console errors;
  - homepage `dv-counter` emitted and displayed `dv:change`;
  - component catalog filtering hid non-matching cards and retained the modal card;
  - all 20 HTML route entry points returned HTTP 200 from the static server.

## Findings

| Severity | Finding | Action |
| --- | --- | --- |
| Medium | Final production legal/operator details are not known. | Keep explicit draft placeholders; complete before launch. |
| Medium | New-site routes are not yet part of the repository's permanent E2E suite. | Add dedicated `site-next` smoke/a11y coverage before production migration. |
| Low | CKCSS is loaded from a pinned CDN URL in the scaffold. | Decide self-hosted versus CDN deployment and verify CSP/assets at launch. |
| Low | Turkish and English content is an initial route set, not a complete editorial translation review. | Human language/legal review remains required. |

## Integration decision

The work is suitable for the next implementation round and does not require a rollback. The
legacy site remains untouched as requested. Before production migration, add permanent browser
checks, finish the real legal content, decide the canonical domain/language behavior, and run the
web launch verification workflow.
