# Task: TASK-013 — Homepage live DevinimJS demo and component catalog

## Goal

Replace placeholder/static interaction on the new homepage and component page with a credible,
working DevinimJS demonstration that teaches the CKCSS-presentation/DevinimJS-behavior split.

## Scope

- Update `site-next/index.html` to load a local DevinimJS module and host a live component demo.
- Update `site-next/components/index.html` with inspectable component examples/contracts.
- Add only page-local demo modules under `site-next/assets/js/` with names prefixed `site-`.

## Out of scope

- Shared shell CSS/JS (TASK-012 owns those files).
- Docs/tutorial copy, translations, legal pages or backend integration.

## Exclusive ownership

- `site-next/index.html`
- `site-next/components/index.html`
- `site-next/assets/js/site-home-demo.js`
- `site-next/assets/js/site-components-demo.js`

## Acceptance

- At least one demo uses a real DevinimJS component/API, not only native event code.
- Demo has a visible state and accessible output.
- Component page shows inputs, events and states without making unsupported product claims.
- Handoff written to `docs/swarm/handoffs/TASK-013-implementer.md`.
