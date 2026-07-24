# Handoff: TASK-007 — Implementer

## Status

Complete.

## Inputs reviewed

- `docs/swarm/tasks/TASK-007-transition-primitives.md` (full task contract).
- `docs/swarm/README.md` (swarm non-negotiable rules).
- `src/components/dv-modal.js`, `dv-toast.js`, `dv-toast-stack.js`, `dv-disclosure.js`
  (pre-change: all four toggle a `hidden` attribute, or splice `state.items`, synchronously the
  instant state changes — no transition opportunity).
- `themes/ckcss.css` (existing `[hidden]`/display rules for these four components).
- `src/core/core.js` (the public export barrel — confirmed it re-exports `BaseComponent`,
  `createReactive`, `createStore`, `html`/`unsafe`/`HtmlString`/`escapeHtml`, `morph`, `define`,
  `safeUrl` only; nothing else) and `scripts/size-check.mjs` (confirmed `npm run size` bundles
  and gzips only `src/core/core.js` via esbuild — any module `core.js` doesn't export is
  structurally invisible to that gate regardless of its own size).
- `src/core/base-component.js` (render/lifecycle pipeline — `requestUpdate()`'s
  already-queued-render guard, `updated(changedKeys)`, `onCleanup`, `emit`) and
  `src/core/morph.js` (keyed-list matching via `data-key`, ADR-0014 — needed for
  `dv-toast-stack`'s now-longer-lived leaving items to keep DOM identity as the array changes).
- `src/core/html.js` (boolean-attribute shorthand rule used for the new `data-leaving`/`hidden`
  interpolations).
- `adr/0017-generated-type-declarations.md` (ADR format/tone reference) and
  `adr/0010-mvp-scope.md` (YAGNI/budget culture, cited directly in the new ADR).
- `eslint.config.mjs` (confirmed `Promise`/`Map`/etc. are already treated as valid globals
  project-wide, and that `tests/**/*.js` has no `window` global — informed the e2e spec's use of
  `globalThis` inside `page.evaluate`).
- `tests/unit/dv-modal.test.js`, `dv-toast.test.js`, `dv-toast-stack.test.js`,
  `dv-disclosure.test.js`, and `tests/unit/atomic-components.test.js` (the task file's own hint —
  "some may be in atomic-components.test.js" — was correct: its `'toast stack queues and
  dismisses messages'` smoke test also needed updating).
- `tests/e2e/components.spec.js` and `playwright.config.js` (existing e2e patterns; confirmed
  Playwright 1.61.1's bundled Chromium is recent enough for the CSS features considered).
- `examples/components.html` (the e2e fixture used by existing modal/toast specs — deliberately
  left untouched; not in this task's file-ownership map, see Open questions).

## Evidence and findings

**Primitive API and reasoning (ADR-0018 has the full writeup):**
`awaitTransition(el, { timeout = 200 } = {})` in `src/core/transition.js` — one function, no
class, no config object beyond the single `timeout` knob. It resolves (never rejects) on the
first of: a `transitionend`/`animationend` firing with `event.target === el` (bubbled events
from descendants are explicitly ignored — a nested element's own transition must not resolve an
ancestor's wait), or the timeout elapsing. Chose this exact shape (matching the task file's own
suggested shape) over two alternatives documented in the ADR: (a) a declarative
`component()`-level animation config — rejected as real animation-library scope, which YAGNI
(ADR-0010) rules out; (b) pure CSS (`@starting-style` + `transition-behavior: allow-discrete`,
no JS at all) — rejected as the *sole* mechanism because it cannot solve `dv-toast-stack` (items
are removed from `state.items` and the DOM outright, not toggled via `hidden`, so there's no
attribute for the browser to defer) and has no fallback for a consumer whose CSS silently fails
to apply. Kept the CSS side deliberately plain (`transition: opacity …` on a `data-leaving`
hook) rather than adding `@starting-style` for a symmetric enter fade — one code path, not two,
matching the minimal-primitive framing.

**Per-component wiring, same shape everywhere:** each of `dv-modal`/`dv-toast`/`dv-disclosure`
gained a private `#visible` flag (drives `hidden` in `template()`, decoupled from public
`state.open`) and a `#closeToken` counter (guards a stale close's resolution from hiding a
dialog/toast/panel that was re-opened before the exit transition finished). Opening stays
synchronous/instant — `state.open` and `#visible` both flip in the same call, exactly as before
this task. Closing: `state.open` flips and its `dv:*` event fires *immediately* (unchanged
timing — verified by keeping the existing focus-return/stack-membership logic in
`dv-modal`'s `updated()` tied to `state.open`, not to `#visible`), then `#visible`'s flip (and
therefore `hidden` reapplying) is deferred behind `awaitTransition(el)`. `dv-toast-stack` uses
the equivalent shape with `item.leaving` instead of a single `#visible` flag, plus a new
`data-key="${item.id}"` on each `<output>` so ADR-0014's keyed morph (not the positional
fallback) tracks each item correctly across its now-longer render lifetime; `dismiss()` also
gained a `leaving`-checking early-return so a toast can't be dismissed twice (extends the
existing ADR-0015-era idempotency guard).

**`dv-tabs`: explicitly not attempted, per the task's own framing.** Its panel switch crossfades
between two panels that are *both already mounted* (only `hidden`/`tabindex` differ per the
active index) — a mutual-exclusion crossfade, not an open/close pair, so `awaitTransition`'s
"defer the teardown of a departing element" shape doesn't map onto it without real redesign
(you'd need to keep the *previous* active panel visible-but-fading while the *new* one is
already interactive, which is a different state machine). Left `src/components/dv-tabs.js`
completely untouched, per the task's explicit instruction not to land a partial/experimental
attempt. Documented as a follow-up in ADR-0018's Consequences.

**Baseline, before any edits:** I did not run a separate pristine `npm test` before starting
(only `npm run size`, which the task calls out explicitly as the primary risk — see below). The
baseline unit-test count is instead derived directly from reading each file before editing it
(quoted counts are `test(...)` blocks actually present, confirmed by reading every file in full
before touching it): `dv-modal.test.js` 9, `dv-toast.test.js` 3, `dv-toast-stack.test.js` 6,
`dv-disclosure.test.js` 2, `atomic-components.test.js`'s one relevant `dv-toast-stack` test
(count unchanged by my edit — only its body changed), `transition.test.js` did not exist (0).
```
npm run size (before any edits) → core bundle: 8368 B min, 3352 B min+gzip (budget 4096 B)  SIZE GATE PASSED
```

**Test run after my changes:**
```
npm run lint → clean (eslint .), including the new tests/e2e/transitions.spec.js and
  src/core/transition.js
npm test → # tests 174  # pass 174  # fail 0  # cancelled 0  # skipped 0  # todo 0
node --test tests/unit/transition.test.js → 6/6 pass (new file: event-resolve x2,
  descendant-bubble ignored, timeout-fallback, default-200ms-value, single-settle)
node --test tests/unit/dv-modal.test.js → 10/10 pass (9 pre-existing, 3 updated in place for the
  new deferred-hidden timing on close, + 1 new timeout-fallback test)
node --test tests/unit/dv-toast.test.js → 4/4 pass (3 pre-existing, 2 updated in place + 1 new
  timeout-fallback test)
node --test tests/unit/dv-disclosure.test.js → 3/3 pass (2 pre-existing, 1 updated in place + 1
  new timeout-fallback test)
node --test tests/unit/dv-toast-stack.test.js → 8/8 pass (6 pre-existing, 4 updated in place for
  the new deferred-removal timing, + 2 new: double-dismiss idempotency, timeout fallback)
node --test tests/unit/atomic-components.test.js → its one dv-toast-stack smoke test updated to
  dispatch a simulated transitionend before asserting removal; all other components in that file
  (dropdown/product-card/field/confirm/autocomplete/data-table/cart/state) untouched.
npx playwright test → 21 passed (14.1-14.4s across runs), 21 = 19 pre-existing (unmodified,
  including "modal closes with Escape and toast announces its message" which still passes
  unchanged because Playwright's expect() polls/retries rather than asserting exact timing) + 2
  new in tests/e2e/transitions.spec.js (see below).
npm run size → core bundle: 8368 B min, 3352 B min+gzip (budget 4096 B)  SIZE GATE PASSED
  — byte-for-byte identical to baseline. This is the primary risk item for this task; confirmed
  explicitly before and after.
npm run verify → lint + 174/174 unit + 21/21 e2e + size, all green.
```

Net new tests added across the suite: `+1` (modal) `+1` (toast) `+1` (disclosure) `+2`
(toast-stack) `+6` (transition.js's own tests) `= +11`. Since `npm test`'s post-change total is
174 and no test was deleted (only updated in place where noted above), the pre-change total in
this worktree was 174 − 11 = **163**.

**Size delta: none, confirmed.** `8368 B min, 3352 B min+gzip` before and after. `src/core/transition.js`
is never imported by `src/core/core.js` — every one of the four components imports it directly
via `../core/transition.js`, the same exclusion pattern already relied on by all component code
(verified during TASK-004..006's review per the task file's own note).

**Real-browser e2e coverage:** added `tests/e2e/transitions.spec.js` with two tests against real
Chromium (not `examples/components.html`'s bare markup alone — that fixture ships no
stylesheet, so I used Playwright's `page.addStyleTag({ path: 'themes/ckcss.css' })` to inject
the shipped reference CSS at test time, without editing the fixture file itself, which is not in
this task's ownership map):
1. Modal: opens, asserts visible; presses Escape; asserts the backdrop is **still visible** and
   carries `data-leaving` immediately after (proving the close is not instantly synchronous
   anymore); then asserts it becomes hidden within 1000ms, timing the actual elapsed ms to prove
   it resolves well under the 1s test timeout — i.e. via the real ~180ms CSS transition, not a
   silently-always-hit timeout fallback.
2. Toast-stack: dynamically imports `dv-toast-stack.js` in-page (the example fixture doesn't
   wire one up), shows and dismisses an item, asserts `data-leaving` appears then the element is
   actually removed from the DOM (`toHaveCount(0)`).

Both pass; the full 21-test e2e suite (existing 19 + these 2) passes together.

**checkJs / `types/` regeneration:** `npm test` includes a `build:types` step that regenerates
`types/` on every run. `types/core/transition.d.ts` (new) and `types/components/dv-toast-stack.d.ts`
(diff: `initialState()`'s `leaving: boolean` field and `dismiss()`'s expanded JSDoc) were
committed alongside the source, matching ADR-0017's "types/ is committed, the same way dist/ is"
precedent and TASK-006's handoff precedent for this exact situation. `dv-modal.d.ts`,
`dv-toast.d.ts`, `dv-disclosure.d.ts` were NOT regenerated with any diff — their new
`#visible`/`#closeToken` fields are private (`#`) and TS collapses those to the existing
`#private;` marker, so their public declaration shape is unchanged. `build:types`'s own
pre-existing-diagnostic count (advisory-only, doesn't fail the gate) was unaffected by this
change (still the same 38 pre-existing implementation-internal diagnostics noted in
ADR-0017/TASK-006).

**`dist/`:** deliberately not rebuilt, same reasoning as TASK-006's handoff — `npm run build`
touches all components at once and isn't exercised by `npm run verify`; better done once at
integration time by the orchestrator/maintainer, not per-task.

## Changed files

- `src/core/transition.js` (new) — the `awaitTransition` primitive. Not re-exported from
  `src/core/core.js` by design (ADR-0018).
- `src/components/dv-modal.js` — `#visible`/`#closeToken` fields, `#applyVisibility()`,
  `onAttribute`/`#setOpen` now route through it; `template()`'s backdrop `hidden` now reads
  `#visible` and gained `data-leaving`. `open()`, `close()`, focus/Tab-trap/stack logic
  unchanged in timing.
- `src/components/dv-toast.js` — same shape: `#visible`/`#closeToken`/`#applyVisibility()`;
  `show()`/`hide()`/`onAttribute` call it; `template()` gained `data-leaving`.
- `src/components/dv-disclosure.js` — same shape; `template()`'s panel gained a
  `.dv-disclosure-panel` class (previously unclassed, needed as a CSS/query hook) plus
  `data-leaving`.
- `src/components/dv-toast-stack.js` — `initialState()`/`show()` items gained `leaving: boolean`;
  `dismiss()` now idempotent-guards on `leaving`, marks it instead of splicing immediately, and
  defers the actual `state.items` filter behind `awaitTransition`; `template()`'s `<output>`
  gained `data-key="${item.id}"` (activates ADR-0014 keyed morph) and `data-leaving`.
- `themes/ckcss.css` — `transition: opacity …` (+ `transform` for toast/toast-stack) and
  `[data-leaving] { opacity: 0; … }` rules for all four components' transitioning elements, a
  `prefers-reduced-motion: reduce` override, and the `.dv-disclosure-panel` class hook.
- `adr/0018-transition-primitives.md` (new) + `adr/INDEX.md` (registered in the table and
  dependency graph).
- `design/component-library.md` — one new paragraph per touched component describing the
  transition-aware close/hide/collapse/dismiss behavior and its backward-compat guarantee.
- `CHANGELOG.md` — new `[Unreleased]` → `Added` bullet.
- `tests/unit/transition.test.js` (new) — 6 tests on the primitive directly (event-resolve ×2,
  descendant-bubble-ignored, timeout-fallback, default-timeout value, single-settle).
- `tests/unit/dv-modal.test.js`, `dv-toast.test.js`, `dv-disclosure.test.js`,
  `dv-toast-stack.test.js` — updated existing close/dismiss assertions to dispatch a simulated
  `transitionend` where the old test relied on synchronous hiding; added one
  no-CSS/timeout-fallback test per file exercising the full component→primitive path with no
  event ever dispatched.
- `tests/unit/atomic-components.test.js` — updated only its one `dv-toast-stack`-touching test
  (`'toast stack queues and dismisses messages'`); every other component's test in that shared
  file is untouched, per this task's ownership boundary.
- `tests/e2e/transitions.spec.js` (new) — 2 real-Chromium tests (see Evidence above).
- `types/core/transition.d.ts` (new, generated) and `types/components/dv-toast-stack.d.ts`
  (regenerated, mechanical diff only) — see Evidence.

No changes to `src/components/dv-tabs.js` or any other component, and no changes to
`docs/swarm/active-work.md`.

## Open questions and risks

- **`examples/components.html` not touched, by design.** It's not in this task's ownership map
  and has no stylesheet at all, so the new e2e spec injects `themes/ckcss.css` at test time via
  Playwright's `addStyleTag` rather than editing the fixture. This proves the shipped CSS works
  against real markup without expanding this task's file-ownership footprint. If the
  orchestrator would prefer a permanent, stylesheet-linked demo fixture for future
  transition-related e2e work, that's a small follow-up outside this task's ownership.
- **Judgment call — timeout default (200ms).** Not specified by the task; chosen to be a typical
  fast-UI-transition duration, short enough that "a consumer with no CSS" still feels
  near-instant, long enough to comfortably outlast the `.18s` (180ms) reference CSS transition
  shipped in `themes/ckcss.css` so the real event — not the fallback — is what actually resolves
  most closes in practice (verified directly by the e2e modal test's elapsed-time assertion).
- **Judgment call — enter/opening transitions are not animated, only exit/closing is.** Chose
  this deliberately (see ADR-0018's Option B discussion): getting a real *enter* fade without
  `@starting-style` needs JS rAF choreography (a second, less-tested code path), and nothing
  downstream depends on an enter transition finishing the way exit-teardown timing does, so it
  didn't earn the added complexity under YAGNI. A consumer wanting a symmetric enter fade can
  layer `@starting-style` CSS on top of the same `hidden` toggle unassisted — this primitive
  doesn't block that.
- **`dv-disclosure-panel`'s transition is opacity-only, not a true height expand/collapse** — an
  accurate version needs JS-measured `scrollHeight`, flagged as a candidate follow-up in
  ADR-0018, not attempted here (YAGNI/scope).
- **`dv-tabs` is deferred, not attempted** — see Evidence above and ADR-0018's Consequences for
  the full reasoning; flagged as a follow-up task since it needs its own state-machine design
  (crossfade between two already-mounted panels), not a forced fit onto `awaitTransition`.
- **Git commit author identity**: same pre-existing worktree quirk noted in TASK-006's handoff —
  no local `user.name`/`user.email` configured, git auto-derived one from the OS
  user/hostname and the commit succeeded with a warning, not an error. Not something I changed.

## Next recipient

Orchestrator
