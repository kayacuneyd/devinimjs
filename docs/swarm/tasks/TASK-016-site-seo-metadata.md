# Task: TASK-016 — New-site SEO metadata and discovery files

## Goal

Close the launch-verification SEO gaps for `site-next/` without changing page copy or layout.

## Scope

- Add canonical URLs and English/Turkish `hreflang` links to the new site's HTML entry points.
- Add `site-next/robots.txt` and `site-next/sitemap.xml` for the planned production root.
- Use `https://devinimjs.digitaltamam.com/` as the current canonical domain from the existing site.

## Out of scope

- Legal text, analytics, redirects, server configuration or production deployment.
- Visual/CSS/JS changes.

## Exclusive ownership

- `site-next/**/*.html` for metadata-only edits in this task round
- `site-next/robots.txt`
- `site-next/sitemap.xml`

## Acceptance

- Every HTML entry point has a title, description and canonical URL.
- Available language equivalents have reciprocal `hreflang` links.
- Sitemap contains only intended public routes and matches the canonical root.
- Robots references the sitemap and does not block public pages.
- Handoff written to `docs/swarm/handoffs/TASK-016-implementer.md`.
