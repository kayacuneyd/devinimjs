# TASK-019 — Site chrome and contact consistency

## Goal

Make the public DevinimJS site feel like one coherent product across routes while preserving the constitution's build-free, accessible and token-led design rules.

## Scope

- Keep the primary navigation stable across the English public routes.
- Keep the footer navigation stable across the English public routes.
- Apply the same shell contract to Turkish routes as those pages are brought into the current site surface.
- Establish a predictable spacing rhythm for page sections, cards, grids and component demos.
- Remove decorative link underlines while retaining visible hover, current-page and keyboard-focus states.
- Make controls compact and visually consistent with the surrounding content.
- Rebuild Contact around public project support and direct mail actions for `info@kaycuneyt.com` and `kayacuneyd@gmail.com`.

## Acceptance criteria

- Every public language route exposes the same primary navigation order and footer destination order.
- The navigation remains usable on narrow viewports without horizontal overflow.
- Contact visibly exposes both email addresses as `mailto:` actions and explains when to use GitHub versus email.
- Component cards have consistent internal spacing and compact native controls.
- `npm run lint`, `npm test`, the site Playwright suite and `npm run size` pass.
- Production route, asset, HTTPS and responsive checks are recorded before handoff.

## Constraints

- Follow `constitution.md` v2.0.0.
- Use CKCSS tokens for visual values; do not introduce raw color, spacing, radius, shadow or motion literals.
- Keep semantic HTML useful before JavaScript and preserve the existing legacy site outside `site-next`.
