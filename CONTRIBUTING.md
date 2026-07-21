# Contributing to DevinimJS

Thanks for helping build DevinimJS. This project follows the
[KayaEOS Engineering Constitution](constitution.md); the summary below is the daily workflow.

## Ground rules

1. **Design first (§1).** Before writing a component, define its states
   (loading → empty → error → success) and its `data-*` API in `design/component-library.md`.
2. **Every significant decision gets an ADR (§4.2).** Copy `adr/_template.md`, number it
   sequentially, register it in `adr/INDEX.md`.
3. **Quality gates (§3).** `npm test`, `npm run lint` and `npm run size` must pass. CI blocks merges.
4. **Security (§8).** Any use of `unsafe()` or changes touching escaping/`safeUrl` require an
   explicit security review note in the PR description.
5. **Accessibility (§5.3).** Interactive components ship keyboard navigation and ARIA roles
   (WCAG AA minimum). Test with a screen reader when possible.

## How to add a component

1. Read [the component contract](docs/component-contract.md).
2. Run `npm run create:component -- dv-your-component` to create the standard files.
3. Complete the generated implementation, tests and API documentation.
4. Register the component in `docs/component-manifest.json`, `design/component-library.md` and
   `CHANGELOG.md` (Unreleased).
5. Add a copyable example in `examples/` when the component has visible behavior.

## Commit & PR

- Small, focused commits; imperative mood ("add dv-tabs keyboard navigation").
- PR checklist: `npm run verify` green · docs updated · ADR if architectural.

## Reporting security issues

Do not open public issues for vulnerabilities. Email the maintainer (see GitHub profile) with a
reproduction case; you will get an acknowledgement within 72 hours.
