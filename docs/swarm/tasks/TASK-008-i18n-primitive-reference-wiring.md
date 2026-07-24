# Task: TASK-008 — i18n/locale primitive design + reference wiring (`dv-modal`, `dv-confirm`, `dv-cart`)

## Goal

Design and build DevinimJS's first locale/i18n primitive for translatable component copy,
closing `docs/roadmap.md` P1's last open item: "No locale-bundle/i18n system for component copy
(all defaults are hardcoded English, override-only via `data-*` strings) — notable given the
target audience (Turkish agencies/freelancers on shared hosting) and DevinimJS's own site already
being bilingual" (the marketing site under `site/en/`/`site/tr/` already uses `en`/`tr` as its
locale codes — match that convention).

This is a **design task first, a wiring task second**. It is deliberately scoped to the primitive
itself plus **three reference components** (`dv-modal`, `dv-confirm`, `dv-cart` — chosen to cover
three distinct shapes: a single string, several related strings, and *parameterized* strings with
interpolated values, see below) rather than all ~13 affected components at once. Once this
contract is fixed and merged, wiring the remaining components is mechanical, repetitive work that
splits cleanly across parallel follow-up tasks with zero file overlap (each component's own file
is self-contained) — that split is intentionally deferred to a later round so it doesn't get
designed by committee.

## Scope and non-goals

### The primitive

- A way for a component to resolve translatable copy through three tiers, highest priority first:
  1. An explicit `data-*` attribute override — the existing contract (ADR-0005) must keep working
     unchanged; a consumer who sets `data-label="..."` today must see identical behavior after
     this task.
  2. A locale-bundle entry for the *active* locale, if one is registered for that component/key.
  3. The hardcoded fallback string already passed at each call site today (unchanged default
     behavior for consumers who never touch locales at all).
- **Active locale resolution:** default to reading `document.documentElement.lang` (the standard
  way a page already declares its language — matches `site/en/`/`site/tr/`'s existing convention),
  with a programmatic override (e.g. `setLocale('tr')`) for apps that need runtime switching
  independent of `<html lang>`. Your call on the exact API shape; document the reasoning.
- **Parameterized strings.** Not every translatable string is static — e.g. `dv-cart`'s per-row
  `aria-label="Decrease ${item.name}"` interpolates a dynamic value. The primitive must support
  this (a translator needs to control word order too, not just substitute a value into a fixed
  English sentence shape) — a simple placeholder-substitution scheme (e.g. `'{name} azalt'` with
  `{name}` replaced) is enough; do not build a full ICU MessageFormat implementation (YAGNI,
  §2.1).
- **Locale bundles are co-located per-component, not centralized.** Do not create one shared
  `locale/en.js` / `locale/all-strings.js` file that every component's bundle lives in — that
  would force every future per-component wiring task to edit the same file, defeating the
  parallel-split this task is setting up. Each component defines its own small bundle (as a plain
  object literal in its own file, or an adjacent sibling file if you prefer — your call, document
  it) so wiring component N only ever touches component N's own file(s).
- **Size budget is the primary technical risk.** `src/core/core.js`'s size gate sits at 3352 B of
  a 4096 B min+gzip budget (~744 B headroom, confirmed unchanged through TASK-004..007). If you
  add a method to `BaseComponent` (in `src/core/base-component.js`, which core.js re-exports),
  every byte counts against that headroom. If you instead keep the primitive as a standalone
  module that components import directly (matching TASK-007's `src/core/transition.js` pattern —
  not re-exported from `core.js`), it's structurally excluded from the gate entirely, at the cost
  of a slightly less ergonomic `t(this, key, fallback)`-style call instead of `this.t(key,
  fallback)`. Measure both before deciding; document the decision and the actual before/after
  `npm run size` numbers either way.

### Reference wiring (exactly these three components, nothing else)

- `dv-modal` — simplest case: one static string (`label`, default `'Dialog'`) plus the
  `aria-label="Close"` on its close button, which is currently hardcoded directly in the template
  (not even routed through `str()` today) — bring it into the same system.
- `dv-confirm` — multi-key case: `label`/`message`/`confirm-label`/`cancel-label`, several related
  strings on one component.
- `dv-cart` — parameterized case: `empty`/`label`/`remove-label`/`total-label` (static) plus the
  per-row `aria-label="Decrease ${item.name}"` / `"Increase ${item.name}"` / `"${item.name}
  quantity"` (parameterized — these are the actual reason this component was chosen).
- For each: provide both `en` (matching today's exact existing hardcoded default strings — no
  wording changes) and `tr` bundles.
- Add one new example, `examples/i18n.html` (or under `examples/`, your call), demonstrating a
  live locale switch (e.g. a toggle that flips `document.documentElement.lang` between `en`/`tr`
  and re-renders) across these three components — don't touch existing example fixtures
  (`examples/components.html` etc.) that other e2e specs already depend on.

### Non-goals

- Do NOT touch any component other than `dv-modal`, `dv-confirm`, `dv-cart`.
- Do NOT wire the other ~10 components (`dv-autocomplete`, `dv-data-table`, `dv-dropdown`,
  `dv-field`, `dv-pagination`, `dv-product-card`, `dv-state`, `dv-tabs`, `dv-toast`,
  `dv-toast-stack`) — that's deliberately deferred to follow-up tasks once this contract lands.
  Feel free to note in the handoff which of their `str()` calls are real translatable copy vs.
  config (survey below is a starting point, not exhaustive) to save the next round some time.
- Do NOT build a full ICU MessageFormat/plural-rules system — simple placeholder substitution
  only.
- Do NOT touch `site/en/`/`site/tr/` (the marketing site's own static bilingual pages) — unrelated
  system, already solved differently.

### Config-vs-copy trap (read before wiring)

Not every `this.str(key, fallback)` call is translatable UI copy — some are behavioral
configuration that happens to be read the same way. Get this wrong and you'd offer a "translation"
for something like an HTML `<input type>` value. Confirmed examples from a survey of the codebase
(useful for this task's three components and as a head start for the follow-up round):
- Real copy (translate): `dv-modal`'s `label`; `dv-confirm`'s `label`/`message`/`confirm-label`/
  `cancel-label`; `dv-cart`'s `empty`/`label`/`remove-label`/`total-label` and its three
  parameterized aria-labels.
- **Not copy, don't touch its meaning** (examples from other components, for the follow-up round's
  benefit — out of this task's file scope either way): `dv-field`'s `control` (`'input'`/
  `'textarea'`/`'select'`) and `type` (an HTML `input[type]` value) are configuration, not
  language; `dv-state`'s `state` (`'empty'`/`'loading'`/`'error'`) selects a render branch, it
  isn't displayed text.

## Acceptance criteria

- `npm test` passes with new tests covering: `data-*` override still wins over any locale entry
  (regression), a registered locale entry is used when active and no `data-*` override is present,
  the hardcoded fallback still applies when neither a `data-*` override nor a locale entry exists,
  parameterized substitution works (including a `dv-cart` case with two rows to prove per-row
  substitution isn't cross-contaminated), and active-locale switching (e.g. flipping `<html lang>`
  and re-rendering, or calling your programmatic override) actually changes rendered copy.
- `npx playwright test` passes; add or extend at least one e2e case exercising a real locale
  switch in a real browser via the new `examples/i18n.html`.
- `npm run lint` clean.
- `npm run size` — report the exact before/after numbers regardless of which design you chose
  (in-budget `BaseComponent` method vs. out-of-budget standalone module). If in-budget, it must
  still pass under 4096 B; if it doesn't fit, fall back to the standalone-module approach rather
  than blowing the gate.
- A new ADR (`adr/0019-i18n-locale-primitive.md`, registered in `adr/INDEX.md`) documenting the
  three-tier resolution order, the active-locale mechanism, the parameterization scheme, the
  per-component-co-located-bundle decision (and why, re: enabling parallel follow-up wiring), and
  the size-budget decision with real numbers.
- A short guide (`docs/guides/i18n.md` or similar) a future implementer can follow to wire up one
  more component in the same pattern — this is what makes the follow-up round mechanical rather
  than another design exercise.
- CHANGELOG entry under `[Unreleased]`.

## Inputs

- Relevant roadmap gap: `docs/roadmap.md` P1 — "No locale-bundle/i18n system for component copy…"
- Read first: `src/core/base-component.js`'s `str()`/`num()`/`bool()`/`json()` helpers (the
  existing attribute-reading pattern this extends), `src/core/transition.js` and
  `adr/0018-transition-primitives.md` (TASK-007's precedent for a primitive kept outside the
  size-gated core barrel, and for ADR format/tone), `src/components/dv-modal.js`,
  `dv-confirm.js`, `dv-cart.js`, `site/en/` vs `site/tr/` (existing `en`/`tr` locale-code
  convention on the marketing site), `adr/0005-attribute-state-contract.md` (the `data-*`
  override contract you must not break), `adr/0010-mvp-scope.md` (YAGNI/budget culture).

## Roles and outputs

| Role | Owner | Output file | Depends on |
| --- | --- | --- | --- |
| Orchestrator | claude (this session) | `docs/swarm/tasks/TASK-008-i18n-primitive-reference-wiring.md` | — |
| Implementer | dispatched agent (isolated worktree) | `docs/swarm/handoffs/TASK-008-implementer.md` | — |

## Exclusive file ownership

| Path or glob | Sole writer | Branch/worktree |
| --- | --- | --- |
| New locale primitive module(s) (implementer's choice of path) | TASK-008 implementer | isolated worktree, branch `swarm/task-008-i18n-primitive-reference-wiring` |
| `src/core/base-component.js` (only if the in-budget design is chosen) | TASK-008 implementer | same |
| `src/components/dv-modal.js`, `dv-confirm.js`, `dv-cart.js` | TASK-008 implementer | same |
| `tests/unit/dv-modal.test.js`, `dv-confirm.test.js` (or wherever it lives — grep first, may be in `atomic-components.test.js`), `cart.test.js`, plus new locale-primitive tests | TASK-008 implementer | same |
| `examples/i18n.html` (new) | TASK-008 implementer | same |
| `adr/0019-i18n-locale-primitive.md`, `adr/INDEX.md` | TASK-008 implementer | same |
| `docs/guides/i18n.md` (new) | TASK-008 implementer | same |
| `CHANGELOG.md` (append-only) | TASK-008 implementer | same |

No other task is open concurrently this round.

## Gates

- [ ] Implementation verified (`npm run verify` green in the task's worktree)
- [ ] Handoff written with evidence and open questions (`docs/swarm/handoffs/TASK-008-implementer.md`)
- [ ] Orchestrator integration review complete
- [ ] Human merge approval received
