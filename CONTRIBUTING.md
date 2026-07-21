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

1. `src/components/dv-your-component.js` → `class DvYourComponent extends BaseComponent` →
   `define('dv-your-component', DvYourComponent)` at file end. One file = one component.
2. Full JSDoc on the class and every public/overridden member.
3. Unit tests in `tests/unit/dv-your-component.test.js`.
4. A copyable example in `examples/`.
5. Entry in `design/component-library.md` and `CHANGELOG.md` (Unreleased).

## Commit & PR

- Small, focused commits; imperative mood ("add dv-tabs keyboard navigation").
- PR checklist: tests green · lint green · size gate green · docs updated · ADR if architectural.

## Reporting security issues

Do not open public issues for vulnerabilities. Email the maintainer (see GitHub profile) with a
reproduction case; you will get an acknowledgement within 72 hours.
