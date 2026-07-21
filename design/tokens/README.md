# Design tokens — source of truth note

DevinimJS is an **unstyled** JavaScript runtime: it ships no colors, typography or spacing of
its own. The single source of truth for design tokens is **[CKCSS](https://github.com/kayacuneyd/ckcss)**
(its `src/` token files and the CSS custom properties they generate).

This directory intentionally contains only this note (recorded as an adaptation of the KayaEOS
blueprint requirement): duplicating tokens here would create two sources of truth and violate
constitution §1.4 in spirit. Components:

- never hardcode design values — they render structure only;
- consume whatever the page's global CSS provides (CKCSS classes/custom properties);
- may use the structural reset `display: contents` on `<dv-outlet>` (structural, not design —
  ADR-0009 #3).

If a DevinimJS component ever needs a truly internal token (e.g. a focus-ring fallback), add it
here as `*.yml` mirroring CKCSS naming, reference it via `var(--ck-…, fallback)`, and record the
decision in an ADR.
