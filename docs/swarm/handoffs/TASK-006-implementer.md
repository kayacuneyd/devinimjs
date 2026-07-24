# Handoff: TASK-006 — Implementer

## Status

Complete.

## Inputs reviewed

- `docs/swarm/tasks/TASK-006-modal-focus-trap.md` (full task contract).
- `docs/swarm/README.md` (swarm non-negotiable rules).
- `src/components/dv-modal.js` (pre-change: Escape-only `onKeydown`, `#focusDialog`,
  `#opener`/opener-focus-return, `#setOpen`, `data-open` sync).
- `tests/unit/dv-modal.test.js` (all 6 pre-existing tests, especially the `KNOWN GAP` test at
  line 100 and its comment block at lines 94-99).
- `src/core/base-component.js` — specifically `#dispatch`/`#owns` (event-delegation ownership
  boundary at custom-element edges) and `updated()`/`connected()` lifecycle timing, which the
  focus-trap stack hooks into.
- `adr/0017-generated-type-declarations.md` and `scripts/build-types.mjs` — to understand how
  `types/components/dv-modal.d.ts` is generated and whether my private-field-only additions would
  change its public surface (they don't; TS collapses real `#private` fields to a `#private;`
  marker).
- `package.json` scripts (`verify`, `size`, `build`, `build:types`) and `scripts/size-check.mjs`
  — confirmed the size gate only bundles `src/core/core.js`, so `dv-modal.js` changes cannot
  affect it.
- `scripts/build-dist.mjs` — confirmed `dist/` is a shared, all-components build artifact not
  owned by this task and not exercised by `npm run verify`.

## Evidence and findings

**Design decision (nested-modal handling):** a module-level `openStack` array of currently-open
`DvModal` instances, most-recently-opened last. `pushOpenStack`/`removeOpenStack` are called from
`connected()` (initially-open case) and `updated()` (every `open` state transition), so all three
ways `state.open` changes (the `open()`/`close()` methods and the live `data-open` attribute)
keep the stack in sync. `onKeydown`'s Tab-handling branch only runs
`if (openStack[openStack.length - 1] === this)` — i.e. only the topmost open modal traps Tab.
`disconnected()` also removes the instance defensively. This is deliberately not a full
modal-manager (no inert-marking of background content, no backdrop/z-index handling — both
explicitly out of scope per the task file).

Why a stack and not just "each instance's own delegated listener is naturally scoped to its own
subtree": that's true and already true today via `BaseComponent#dispatch`'s `#owns()` ownership
boundary (a keydown bubbling from inside a nested custom element never triggers an ancestor
component's action even though the ancestor's own listener also fires) — verified by reading
`#dispatch`/`#owns` in `base-component.js`. But that only protects the *DOM-nesting* case. Two
modals that are DOM *siblings* (the common real-world pattern — every existing test appends
`<dv-modal>` directly to `document.body`) have no such protection: if focus ever ends up back in
a background modal's subtree while a second modal is on top (plausible since this component
doesn't do backdrop/inert management), the background modal's own `onKeydown` would happily trap
Tab there too, fighting the foreground modal. The stack closes that gap. This is exercised
directly by the new nested-modal test's `tabInA` assertion (Tab dispatched *inside* A's own
subtree while B is open must NOT be intercepted by A).

**Focusable-element order:** the close (×) button is the first element in DOM order (it's in
`<header>`, which precedes `.dv-modal-content`), so "first focusable" in every new test is the
close button, not the caller-supplied content — documented explicitly in a comment above the new
test block so this isn't confusing on re-read.

**Test run before my changes (baseline):**
```
npm test  → # tests 144  # pass 144  # fail 0
npm run size → core bundle: 8368 B min, 3352 B min+gzip (budget 4096 B)  SIZE GATE PASSED
```

**Test run after my changes:**
```
npx eslint src/components/dv-modal.js tests/unit/dv-modal.test.js  → no output (clean)
npm run lint  → clean (eslint .)
npm test → # tests 147  # pass 147  # fail 0  # cancelled 0  # skipped 0  # todo 0
node --test tests/unit/dv-modal.test.js → 9/9 pass (5 pre-existing unmodified + 4 new)
npx playwright test → 19 passed (14.8s), including
  "modal closes with Escape and toast announces its message" (real Chromium, unaffected)
npm run size → core bundle: 8368 B min, 3352 B min+gzip (budget 4096 B)  SIZE GATE PASSED (unchanged)
npm run verify → lint + 147/147 unit + 19/19 e2e + size, all green
```

**Test count:** 144 → 147 net (+3): the single `KNOWN GAP` test (1) was replaced by four real
tests (Tab wraps last→first, Shift+Tab wraps first→last, mid-dialog Tab is left alone, nested
modals) = +3 net. All 5 pre-existing passing tests (open/Escape/light-DOM-preservation,
initial-open auto-focus, opener-focus-return, close-button, `data-open` live sync) are byte-for-
byte unmodified and still pass.

**Size delta:** none. `npm run size` bundles only `src/core/core.js` (`scripts/size-check.mjs`);
`dv-modal.js` is a component, not part of the size-gated core, and it imports nothing new from
`src/core/`. Before and after: `8368 B min, 3352 B min+gzip` (budget 4096 B) — identical.

**checkJs diagnostic count (advisory only, does not fail `build:types`):** went from 34 to 37
pre-existing diagnostics. Confirmed via `tsc -p tsconfig.json` directly: the 4 new diagnostics are
`Property 'focus'/'hidden' does not exist on type 'Element'` / `Element[] not assignable to
HTMLElement[]` — the exact same category of diagnostic `dv-tabs.js` already has for its own
`querySelector(...).focus()` calls. Not a new class of problem introduced by this change; it's
the established, already-accepted codebase pattern (untyped `querySelector` returns `Element`,
JSDoc doesn't narrow it). `build:types` still passes (`noEmitOnError: false`, diagnostics are
advisory) and `types/components/dv-modal.d.ts` still contains every required symbol.

**`types/components/dv-modal.d.ts`:** regenerated as a side effect of `tests/unit/type-
declarations.test.js` (it force-deletes and rebuilds `types/` on every `npm test` run). Diff is
one line — the class-level JSDoc summary comment changed from "Accessible modal dialog with
Escape and close-button support." to "Accessible modal dialog: Escape to close, close-button, and
a WAI-ARIA APG Tab focus trap." No public method signatures changed; all new methods
(`#trapTab`, `#focusableElements`) and the new module-level helpers (`pushOpenStack`,
`removeOpenStack`) are private/module-scoped and correctly collapse to the existing `#private;`
marker. I committed this regenerated file alongside the source change since leaving it stale
would be the actual inconsistency.

**`dist/modules/dv-modal.js`:** deliberately NOT rebuilt. `scripts/build-dist.mjs` (`npm run
build`) rebuilds `dist/` for all 16 components at once, including `dv-data-table` (TASK-004) and
`dv-pagination` (TASK-005), which are out of this task's ownership and may have in-flight,
unmerged changes in their own worktrees right now. Running `npm run build` here would produce a
`dist/` snapshot mixing my change with whatever TASK-004/005 happen to currently look like on
`main`, which isn't this task's call to make. `npm run verify` doesn't invoke `npm run build`, so
this doesn't block the gate. Flagging for the orchestrator: a single `npm run build` pass makes
sense once, at integration/merge time, after all three P1 tasks have landed — not per-task.

## Changed files

- `src/components/dv-modal.js` — Tab focus trap (`#trapTab`, `#focusableElements`,
  `FOCUSABLE_SELECTOR`), module-level `openStack` + `pushOpenStack`/`removeOpenStack`, new
  `disconnected()` hook, `connected()`/`updated()` now maintain stack membership. Existing
  `open()`, `close()`, `#setOpen()`, `#focusDialog()`, `onAttribute()`, `template()` unchanged.
- `tests/unit/dv-modal.test.js` — removed the `KNOWN GAP`/`KNOWN LIMITATION` test and its comment
  block; added 4 new tests (Tab wrap last→first, Shift+Tab wrap first→last, mid-dialog Tab
  no-op, nested-modal stack precedence/handoff). The 5 pre-existing tests are unmodified.
- `CHANGELOG.md` — new `[Unreleased]` → `Added` bullet describing the focus trap and
  nested-modal stack.
- `types/components/dv-modal.d.ts` — regenerated (one-line class-summary-comment diff only, see
  above); not in this task's exclusive-ownership list but a direct, mechanical, correctness-only
  consequence of the source change.

No changes to `src/components/dv-data-table.js`, `src/components/dv-pagination.js`, or any other
file outside this task's ownership map. `dist/` untouched (see above).

## Open questions and risks

- **`dist/modules/dv-modal.js` staleness**: as noted above, left untouched on purpose. The
  orchestrator/human maintainer should run `npm run build` once after TASK-004/005/006 all land,
  not have each task rebuild the shared `dist/` output independently (risk of clobbering each
  other's in-flight component changes).
- **checkJs diagnostic count (34→37)**: advisory-only, doesn't fail any gate, and matches an
  existing codebase-wide pattern (`Element` vs `HTMLElement` narrowing gaps already present in
  `dv-tabs.js` and others) rather than introducing a new one. Flagging in case a future task
  wants to tighten these narrowings project-wide — out of scope here.
- **Judgment call — stack vs. pure subtree-scoping**: I initially considered whether the existing
  `BaseComponent#dispatch`/`#owns` ownership-boundary logic already made a stack unnecessary. It
  covers the DOM-nested-modal case but not the (more common, per the existing test style) DOM-
  sibling case, so I kept the stack — it's the minimal addition that actually satisfies "the
  outer dialog's trap must not fight the inner one" for realistic markup, and the task file
  explicitly offered a stack as an acceptable example of "the simplest correct model."
  Documented at length in the `openStack` JSDoc comment in `dv-modal.js` itself, not just here.
- **`git commit` author identity**: this worktree had no local `user.name`/`user.email`
  configured; git auto-derived one from the OS user/hostname (`root@serverkaya...`) and the
  commit succeeded with a warning, not an error. Not something I changed or should change
  per the git safety protocol (never touch git config) — flagging in case the orchestrator wants
  a real identity attached before merge.
- No behavior change to Escape handling beyond adding an early `return` after it (functionally
  identical — Escape and Tab were already mutually exclusive branches). Not gated by the stack:
  Escape still closes whichever modal's subtree currently contains focus, matching pre-existing
  behavior and out of this task's scope to change.

## Next recipient

Orchestrator
