# Task: TASK-012 — Public site responsive shell and accessibility

## Goal

Bring the new `site-next/` shell to the design-system baseline: mobile-first navigation,
responsive layout, visible focus, reduced motion and no narrow-viewport overflow.

## Scope

- Improve `site-next/assets/css/site.css`.
- Add or refine the shared header/footer behavior in `site-next/assets/js/site.js` only when
  needed for the shell.
- Verify representative pages at narrow, tablet and desktop widths with static HTML checks.

## Out of scope

- Page copy, Turkish translations, legal content or component demos.
- Changes to `constitution.md`, design-system or redesign spec.

## Exclusive ownership

- `site-next/assets/css/site.css`
- `site-next/assets/js/site.js`

## Acceptance

- Mobile navigation is keyboard-operable and exposes correct `aria-expanded` state.
- No horizontal page overflow at narrow widths.
- Focus, reduced motion and touch-target expectations are addressed.
- Existing counter demo behavior remains intact.
- Handoff written to `docs/swarm/handoffs/TASK-012-implementer.md`.
