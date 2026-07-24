# Task: TASK-018 — Constitution v2 public-site rebuild

## Goal

Rebuild the public DevinimJS site around the adopted 2.0.0 constitution: CKCSS token discipline,
fluid responsive layout, self-hostable static assets, accessible progressive disclosure and a calm
technical character.

## Scope

- Replace site-only raw visual literals with CKCSS semantic tokens and closed scales.
- Add a self-hosted CKCSS asset path; the site must not depend on a CDN to render.
- Recompose the homepage boundary story and live DevinimJS demo without changing runtime APIs.
- Widen the component catalog to its intended catalog layout and keep source panels keyboard-scrollable.
- Preserve existing route contracts, English/Turkish information architecture and static hosting.

## Acceptance criteria

- `npm run lint`, `npm test`, `npm run test:e2e` and `npm run size` pass.
- Homepage and component catalog have zero axe WCAG A/AA violations.
- Critical English/Turkish routes have no horizontal overflow at mobile and desktop widths.
- Buttons meet semantic-token contrast; code blocks with overflow are keyboard-focusable.
- Public route, HTTPS redirect, certificate and self-hosted CKCSS asset are verified after deployment.
