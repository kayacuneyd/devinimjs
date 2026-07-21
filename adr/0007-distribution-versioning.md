# ADR-0007: Distribution & versioning

- **Status:** Accepted
- **Date:** 2026-07-21
- **Deciders:** Cüneyt Kaya + AI pair
- **Constitution links:** §10 (SemVer, changelog), §8.4 (pinning), §9.3
- **Mirrors:** the CKCSS distribution model

## Context

Consumers are on shared hosting with no build tooling. Distribution must match the CKCSS model
that already works for this audience.

## Decision

1. **Product contract:** one `<script type="module">` tag is the complete installation.
   No npm install for consumers, ever.
2. **Two consumption styles:**
   - **Per-module ESM** — import exactly what you use; relative imports resolve on jsDelivr:
     `import { BaseComponent, html, define } from 'https://cdn.jsdelivr.net/gh/kayacuneyd/devinimjs@v0.1.0/dist/core.min.js';`
   - **All-in-one** — `dist/devinim.min.js` (core + all framework components, self-registering).
3. **Committed `dist/` artifacts** (same model as CKCSS): `dist/core.js` (readable ESM),
   `dist/core.min.js`, `dist/modules/*.js` (per-component, importing `../core.min.js`),
   `dist/devinim.min.js`. Built by dev-time scripts before a release; `dist/` is **not**
   git-ignored. Until the first tagged release, `src/` serves as the distributable.
4. **Pinning discipline:** docs always show version-pinned URLs (`@v0.1.0`); unpinned/`@latest`
   URLs are documented as production-forbidden.
5. **Import maps** are documented as the ergonomic option for multi-module pages:
   ```html
   <script type="importmap">
     { "imports": { "devinim": "https://cdn.jsdelivr.net/gh/kayacuneyd/devinimjs@v0.1.0/dist/core.min.js" } }
   </script>
   ```
6. **Versioning:** SemVer (§10). During 0.x, MINOR releases may contain breaking changes
   (stated in README and CHANGELOG). Releases follow Keep-a-Changelog; breaking changes follow
   the constitution §10.2 process (ADR → deprecation warning → migration guide → next MAJOR).

## Considered alternatives (rejected)

- npm-only distribution — useless for the shared-hosting audience.
- esm.sh / unpkg as primary — jsDelivr+GitHub Releases already proven by CKCSS; one trusted path.
- Shipping TypeScript sources with JSDoc types — requires transpilation for older module parsers;
  plain ESM + JSDoc keeps the zero-build promise (a `.d.ts` may be added post-MVP).

## Consequences

**Positive:** identical operational model to CKCSS — one mental model for the whole ecosystem.
**Negative / to manage:** release process is manual until scripted; a `scripts/build-dist.mjs`
(minify via dev-time esbuild) is a pre-0.1.0 task.
