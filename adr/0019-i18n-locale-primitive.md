# ADR-0019: i18n/locale primitive (`t`, `registerLocales`, `setLocale`)

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** Cüneyt Kaya
- **Constitution links:** §2.1 (YAGNI), §9.3 (performance budget), DevinimJS build-free boundary
  rules 1 and 4
- **Depends on:** ADR-0005 (attribute ↔ state contract, whose `data-*` override tier this must not
  break)

## Context

`docs/roadmap.md` flagged a P1 gap: DevinimJS ships no locale-bundle/i18n system for component
copy — every translatable default is hardcoded English, overridable only per-instance via
`data-*` strings (ADR-0005). This is notable given the target audience (Turkish
agencies/freelancers on shared hosting) and given DevinimJS's own marketing site is already
bilingual (`site/en/`/`site/tr/`, using `en`/`tr` as locale codes — the convention this ADR
matches).

This task is design-first: build the primitive, then wire exactly three reference components
(`dv-modal`, `dv-confirm`, `dv-cart`) chosen to cover three distinct shapes — one static string, a
multi-key case (several related strings sharing a component), and a parameterized case (strings
with an interpolated value, e.g. `aria-label="Decrease ${item.name}"`). Wiring the remaining ~10
components is deliberately deferred to follow-up tasks once this contract is fixed, and the whole
point of this task's design constraints is to make that follow-up mechanical and parallelizable
rather than another design exercise.

As with ADR-0018, the hard constraint is `src/core/core.js`'s size gate: 4096 B min+gzip, sitting
at 3352 B before this task (~744 B of headroom, confirmed unchanged through TASK-004..007). Any
shared primitive risks spending that headroom permanently for every consumer of `core.js`,
including the ~10 components that won't use i18n even after the follow-up round.

## Decision drivers

- Three-tier resolution, highest priority first: an explicit `data-*` override (ADR-0005, must
  keep working byte-for-byte unchanged) > an active-locale bundle entry > the hardcoded fallback
  already passed at each call site today. No existing consumer who never touches locales should
  observe any behavior change.
- Active-locale resolution needs both a sensible zero-config default (read `<html lang>`, since
  that's how a page already declares its language, and matches `site/en/`/`site/tr/`) and a
  programmatic override for apps that switch locale at runtime independent of navigation.
- Parameterized strings need real word-order control for a translator, not just value splicing
  into a fixed English sentence shape — but a full ICU MessageFormat/plural-rules engine is
  explicitly out of scope (YAGNI, §2.1; non-goal in the task contract).
- Locale bundles must be co-located per component, never centralized — a shared
  `locale/en.js`-style file would force every future one-component wiring task to edit the same
  file, defeating the very parallel-split this task exists to set up.
- Size-budget impact must be measured, not assumed, for both an in-budget `BaseComponent` method
  and a standalone module excluded from the gate (ADR-0018's precedent) — decide from real
  numbers.

## Considered options

### Option A — In-budget: `t(key, fallback, params)` as a `BaseComponent` method

Add a fourth coercion-style helper alongside `str`/`num`/`bool`/`json`, plus module-level
`registerLocales`/`setLocale`/`onLocaleChange` re-exported from `core.js` so `t()` has something
to read.

Pros: most ergonomic call site (`this.t('label', 'Dialog')`), consistent with the existing
attribute-helper family.
Cons: spends part of the `core.js` size budget on every consumer, including components that will
never carry translatable copy (e.g. `dv-pagination`). Measured directly for this ADR (see below):
+187 B min+gzip over baseline, landing at 3539 B — still under the 4096 B gate (557 B headroom
remaining), but it is a **permanent** tax paid once per project regardless of how many components
actually use it, and it consumes the majority of what little headroom ADR-0018 was careful to
preserve.

### Option B — Standalone module, imported directly (mirrors ADR-0018's `awaitTransition`)

`t(el, key, fallback, params)` plus `registerLocales`/`setLocale`/`getLocale`/`onLocaleChange`
live in `src/core/i18n.js`, **not** re-exported from `core.js`. Components that need it
`import { t, registerLocales, onLocaleChange } from '../core/i18n.js'` directly.

Pros: zero cost to `core.js`'s size gate, verified empirically (see below) — components that never
import it pay nothing, and the ~10 components deferred to follow-up rounds are unaffected until
(and unless) they're actually wired. Directly mirrors the exclusion pattern this project already
relies on for `transition.js` (ADR-0018), so there's no new mental model to learn.
Cons: call sites read `t(this, 'label', 'Dialog')` instead of `this.t('label', 'Dialog')` — one
extra token, and the component instance has to be threaded through explicitly.

**Chosen: Option B.** The measured in-budget cost (Option A) does technically fit, but paying a
permanent, budget-consuming tax for ergonomics alone — on every `core.js` consumer, forever,
regardless of whether that project ever uses i18n — cuts directly against this project's stated
budget discipline (ADR-0010, and ADR-0018's explicit choice of the same exclusion for a smaller,
single-function primitive). A primitive this large (three-tier resolution, a locale registry, a
change-notification pub/sub, and substitution) is exactly the kind of feature that should be
opt-in-by-import, not baked into every component's base class.

### Option C — Centralized locale files (`locale/en.js`, `locale/tr.js` covering all components)

One shared bundle file per locale, imported by every wired component.

Pros: a translator sees one file per language, all strings in one place.
Cons: directly defeats this task's own stated purpose — every future one-component wiring task
would need to edit the same shared file(s), reintroducing the file-conflict problem the
per-component split (TASK-004..007's pattern) was designed to avoid. Explicitly ruled out by the
task contract. Rejected.

## Decision

- New module `src/core/i18n.js`, structurally excluded from the `core.js` size gate exactly like
  `src/core/transition.js` (ADR-0018) — components import it directly, never through `core.js`'s
  barrel.
- **Resolution (`t(el, key, fallback, params)`):**
  1. `el.dataset[key]` (an explicit `data-*` override) — identical lookup to
     `BaseComponent#str()`, so ADR-0005's contract is unchanged: `data-confirm-label="..."` still
     wins over everything else.
  2. The active locale's registered bundle entry for `el`'s tag name and `key`, if any.
  3. `fallback`, unchanged from today's hardcoded default.
- **Locale bundles are co-located, one small sibling file per component:**
  `src/components/dv-modal.locale.js`, `dv-confirm.locale.js`, `dv-cart.locale.js`, each
  `export default { en: {...}, tr: {...} }`, imported and registered by that component's own file
  via `registerLocales('dv-modal', locales)` at module load. Wiring one more component touches
  exactly that component's own `.js` file plus a new sibling `.locale.js` file — never another
  component's files, matching the parallel-split TASK-004..007 already established.
- **Active locale (`getLocale()`):** `setLocale()`'s override, if set, else
  `document.documentElement.lang`, else `'en'`. Read fresh on every `t()` call — nothing is
  cached, so a locale switch is visible on the very next render.
- **Programmatic override (`setLocale(locale)`):** sets the override (or clears it when passed
  `null`/falsy) and synchronously notifies every `onLocaleChange()` subscriber. All three
  reference components subscribe once, in `connected()`
  (`this.onCleanup(onLocaleChange(() => this.requestUpdate()))`), reusing the existing
  `requestUpdate()` escape hatch (already documented for "external data sources") rather than
  inventing a second re-render mechanism. A bare `document.documentElement.lang` mutation with no
  `setLocale()` call does **not** auto-trigger a re-render (no `MutationObserver` is installed —
  YAGNI; a consumer who flips `<html lang>` directly is expected to also call `setLocale()` or
  trigger a re-render itself, documented in `docs/guides/i18n.md`).
- **Parameterization:** `{name}`-style placeholders, replaced via a single `String.replace` with a
  regex — no ICU MessageFormat, no plural rules (YAGNI, explicit non-goal). Both bundle entries
  and `data-*` overrides support placeholders, so a translator (or a consumer writing a custom
  override) controls word order, not just a spliced-in value — e.g. Turkish's
  `'{name} azalt'` (word order: name, then verb) versus English's `'Decrease {name}'`.
  Unmatched placeholders are left as literal text (`'{name}'`) rather than silently blanked, so a
  typo'd bundle entry degrades visibly.

### Reference wiring

- `dv-modal`: `label` (unchanged key/default `'Dialog'`); `close` is new — the close button's
  `aria-label="Close"` was previously hardcoded directly in the template, not even routed through
  `str()`. It now resolves through the same three tiers, default `'Close'`, with a new
  `data-close` override lever nobody had before.
- `dv-confirm`: `label` (button text, default `'Delete'`), `message` (default `'Are you sure?'`),
  `confirmLabel`, `cancelLabel`. **Bug fix, in scope:** the pre-existing code called
  `this.str('confirm-label', 'Confirm')` and `this.str('cancel-label', 'Cancel')` — literal
  kebab-case strings passed as dataset keys. `HTMLElement.dataset` only exposes camelCase named
  properties per spec; `dataset['confirm-label']` is `undefined` in a real browser (confirmed:
  happy-dom, the unit-test DOM shim, non-spec-compliantly accepts both forms, which is why this
  was never caught by the existing test suite — no test set `data-confirm-label`/`data-cancel-label`
  either). These `data-*` overrides have therefore never worked in production. Fixed to the
  correct camelCase keys (`confirmLabel`, `cancelLabel`) as part of routing these calls through
  `t()`, per ADR-0005's own documented contract (`data-page-title` → key `pageTitle`). This is a
  fix, not a regression: nothing depended on the broken behavior.
  Also new: `confirmingLabel` (default `'Confirm action'`, the pending-state group's
  `aria-label`). Previously this reused the *same* `label` key as the button text (both called
  `str('label', ...)` with different per-call-site fallbacks) — an incidental coupling (one
  `data-label` override silently drove two different UI strings), never tested or documented as
  intentional. Splitting it into its own key/override lever (`data-confirming-label`) is a
  deliberate clarification: one key, one meaning, matching how every other key in this primitive
  behaves. Not a regression — no test or documented contract relied on the coupling, and the `en`
  fallback text for both strings is byte-for-byte unchanged.
- `dv-cart`: `empty`, `label`, `removeLabel`, `totalLabel` (same kebab-key bug, same fix, as
  `dv-confirm`) plus three new parameterized keys — `decreaseLabel` (`'Decrease {name}'`),
  `increaseLabel` (`'Increase {name}'`), `quantityLabel` (`'{name} quantity'`) — previously fully
  hardcoded template literals (`` `Decrease ${item.name}` ``) with no `str()` call at all. These
  are the actual reason `dv-cart` was chosen as the parameterized reference case.
- New `examples/i18n.html`: a locale-switch toggle (`en`/`tr`) driving all three components live,
  plus `tests/e2e/i18n.spec.js` proving a real browser locale switch changes rendered copy across
  all three, including two distinct cart rows to prove parameterized substitution doesn't
  cross-contaminate between rows.

## Size-budget measurement (both options, real numbers)

| Build | min | min+gzip | Δ vs. baseline | Headroom left (4096 B budget) |
|---|---|---|---|---|
| Baseline (before this task) | 8368 B | 3352 B | — | 744 B |
| **Chosen — standalone `src/core/i18n.js`, not re-exported from `core.js`** | 8368 B | 3352 B | **+0 B** | 744 B (unchanged) |
| Rejected — in-budget `BaseComponent#t()` + exported `registerLocales`/`setLocale`/`onLocaleChange` | 8849 B | 3539 B | +187 B | 557 B |

The standalone-module number is the one actually shipped, verified with `npm run size` against
the final tree (identical to baseline: `dv-modal.js`/`dv-confirm.js`/`dv-cart.js` import
`../core/i18n.js` directly, never through `core.js`'s barrel, so esbuild's bundling of `core.js`
never touches it — the same mechanism ADR-0018 verified for `transition.js`). The in-budget row
was measured by temporarily adding the equivalent method + exports to
`src/core/base-component.js`/`core.js`, running `npm run size`, and reverting — kept only as a
documented data point, not shipped.

## Consequences

**Positive:** a real, tested locale primitive for the three highest-value reference components,
zero cost to the size-gated core budget, and a per-component-file wiring pattern proven end to end
(unit + e2e) that the next round can replicate mechanically per `docs/guides/i18n.md`. Two
latent, never-triggered `data-*` override bugs (`dv-confirm`'s `confirm-label`/`cancel-label`,
`dv-cart`'s `remove-label`/`total-label`) are fixed as a side effect of routing those calls
through the same camelCase-key contract every other key already follows.

**Negative / to manage:**

- `t(el, key, fallback, params)` is one token less ergonomic than a hypothetical `this.t(...)` —
  accepted deliberately (see Option A vs. B above); every future wiring task inherits this same
  call shape.
- `dv-confirm`'s pending-state `aria-label` now has its own override lever
  (`data-confirming-label`) instead of implicitly following `data-label`. Any hypothetical
  existing consumer who *did* rely on one `data-label` attribute silently changing both strings
  (undocumented, untested) would need to also set `data-confirming-label` going forward — flagged
  here explicitly since it's the one place this task exercised judgment beyond a literal
  line-for-line port of the existing strings.
- No automatic re-render on a bare `<html lang>` mutation (only `setLocale()` notifies
  subscribers) — documented in `docs/guides/i18n.md` as the one thing a consumer must remember:
  call `setLocale()` (even redundantly, to the value `<html lang>` already resolves to) or trigger
  a re-render explicitly.

**Follow-ups:** wiring the remaining ~10 components (`dv-autocomplete`, `dv-data-table`,
`dv-dropdown`, `dv-field`, `dv-pagination`, `dv-product-card`, `dv-state`, `dv-tabs`, `dv-toast`,
`dv-toast-stack`) is now mechanical per `docs/guides/i18n.md` and splits with zero file overlap,
one task per component. A starting survey of which of their existing `str()` calls are real
translatable copy versus behavioral configuration (not to be "translated") is in this task's
implementer handoff (`docs/swarm/handoffs/TASK-008-implementer.md`) and the task contract
(`docs/swarm/tasks/TASK-008-i18n-primitive-reference-wiring.md`).
