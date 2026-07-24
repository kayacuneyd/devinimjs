# Task: TASK-017 — Permanent new-site browser and accessibility checks

## Goal

Make the redesign's critical browser checks repeatable in the repository's Playwright suite.

## Scope

- Add `tests/e2e/site-next.spec.js`.
- Cover English/Turkish critical route loading, no console/page errors, mobile no-overflow,
  homepage DevinimJS interaction and component catalog filtering.
- Add an axe check for the homepage and component catalog if the existing fixture supports it.

## Out of scope

- Changes to the new site's implementation, shared CSS/JS or existing e2e tests.

## Exclusive ownership

- `tests/e2e/site-next.spec.js`

## Acceptance

- Tests pass through `npm run test:e2e`.
- Mobile and desktop viewports are covered.
- Failure messages identify route and interaction context.
- Handoff written to `docs/swarm/handoffs/TASK-017-implementer.md`.
