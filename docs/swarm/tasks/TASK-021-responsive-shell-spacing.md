# TASK-021 — Responsive shell and component spacing

## Goal

Make the public site navigation usable on narrow screens and give CKCSS-backed cards and controls a coherent visual rhythm.

## Delivered

- Added a shared accessible mobile navigation toggle using the existing site module.
- Added Escape, outside-click and desktop-resize close behavior.
- Reduced the public footer to Privacy, Terms and License.
- Added token-based padding to site cards that use `ck-stack` and aligned badges to the card content edge.
- Kept radius hierarchy intentional: cards use the large surface radius, buttons use the medium control radius, and compact native controls use the small radius.
- Added responsive navigation and footer regression coverage.

## Acceptance evidence

- 9/9 site Playwright/Axe tests passed.
- 225 unit tests passed.
- Changed site JavaScript and E2E tests pass ESLint.
- Size gate passed.
- Live route, HTTPS redirect, mobile menu and no-overflow checks passed.

## Constraints

- Follow `constitution.md` v2.0.0.
- Use CKCSS tokens for padding, spacing, radii and control sizing.
- Do not stage unrelated user changes in the working tree.
