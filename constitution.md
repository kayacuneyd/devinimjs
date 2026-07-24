# Engineering Constitution

This project is governed by the **KayaEOS Engineering & Design Constitution**:

- Canonical source: <https://github.com/kayacuneyd/kayaengineeringos/blob/main/constitution.md>
- Adopted version: **2.0.0** (2026-07-24) — supersedes 1.0.0 (2026-07-19). The §1–§10 key
  bindings are unchanged; v2.0 deepens the DevinimJS/CKCSS-local sections below (build-free
  boundary, product/design principles) into enforceable clauses and adds three new local
  sections: Mathematical Design & Token Discipline, Fluid Design & Responsive Contract, and the
  AI & Developer Contract. Nothing here contradicts the canonical §1–§10; where this file is
  silent, canonical wins.

All playbooks, ADRs, code reviews and development workflows in this repository derive from, and
must not contradict, that constitution. Key bindings for daily work:

- §1 Design first — components, states and tokens before code.
- §2 Simplicity — YAGNI, 3-pass rule, no premature abstraction.
- §3 Quality gates — tests, review, lint are non-negotiable.
- §5 Progressive enhancement — **deliberately waived for DevinimJS components**; see ADR-0001.
- §8 Security — never trust input; `unsafe()` usage requires security review.
- §9 Performance — core < 4 KB min+gzip; measure before optimizing.
- §10 SemVer + Keep-a-Changelog.

## DevinimJS build-free boundary

The following project-level rules preserve the library's shared-hosting contract while allowing
runtime capabilities to grow:

1. Runtime code has no npm or other runtime dependency.
2. Source modules run directly as browser ES modules without bundling or transpilation.
3. `dist/` is an optional optimized distribution, never the only supported entry point.
4. Build tooling is limited to publishing concerns such as minification, source maps, packaging
   and type declarations.
5. Runtime features must not require compile-time template analysis, dependency graphs or code
   generation.
6. Every new feature must work in the build-free source runtime before it is distributed in
   optimized artifacts.
7. A consumer must be able to deploy by copying the published JavaScript files to shared hosting.

Build may be used; build must never be required.

## Performance and shared-hosting guarantees

These clauses make §9 concrete and testable rather than aspirational:

1. **Absolute core budget.** `dv-core` stays under 4 KB min+gzip, CI-gated by `npm run size`
   (`scripts/size-check.mjs`). Current measured size (see `CHANGELOG.md`) is ~3.35 KB — treat the
   remaining headroom as scarce, not free. Any PR that grows the core bundle must state the
   before/after `npm run size` numbers in its description; growth without justification is
   grounds for rejection in review.
2. **No CDN dependency in the documented install path.** CKCSS and DevinimJS assets must be
   self-hostable, pinned and cacheable static files. No page may depend on an unpinned CDN asset
   (already required by `docs/design-system.md`); this extends to fonts, icons and any future
   asset type.
3. **Zero build step for the runtime path.** A consumer must be able to copy files via FTP/SFTP
   to a shared-hosting document root (typical target: Apache/PHP, DizgePHP's deployment model)
   and have the library work with no Node process, no edge function and no serverless
   requirement at runtime.
4. **Plain CSS delivery.** CKCSS ships as files consumable via `<link>`. No CSS-in-JS runtime, no
   PostCSS-required output for the source path. PostCSS/build tooling may produce the optional
   `dist/` optimization, per the build-free boundary above, but the checked-in source must render
   correctly when linked directly.
5. **No animation-library dependency.** Motion uses CSS transitions/animations, the
   `--ck-duration-*`/`--ck-ease-*` tokens, or the Web Animations API only — consistent with rule
   1 of the build-free boundary.
6. **Size discipline is part of "done."** Every new component records its `npm run size`
   before/after delta in the CHANGELOG entry — this has been existing practice; v2.0 makes it a
   constitutional requirement, not a courtesy.

## Product and design principles

DevinimJS and its companion CKCSS are governed by a shared product boundary. The detailed
visual and interaction rules live in [`docs/design-system.md`](docs/design-system.md); the
following principles are constitutional constraints:

1. **Separate responsibilities:** semantic HTML owns content and structure, CKCSS owns
   presentation, and DevinimJS owns interaction and application state.
2. **Progressive disclosure:** a page must remain understandable and useful before optional
   application behavior is loaded. This applies to the documentation site and static content;
   the deliberate component-runtime exception remains defined by ADR-0001.
3. **Responsive by default:** start mobile-first, let content determine layout, and test real
   narrow, wide, touch and keyboard states rather than treating responsiveness as a final pass.
   See "Fluid design and responsive contract" below for the concrete mechanics.
4. **Accessible by default:** native controls, visible focus, semantic landmarks, readable
   contrast, reduced-motion support and keyboard-complete interaction are release requirements.
5. **Token-led design:** colors, type, spacing, radii, elevation and motion come from CKCSS
   tokens or documented aliases; one-off visual values require a recorded reason. See
   "Mathematical design and token discipline" below for the enforceable version of this rule.
6. **Explainable interfaces:** documentation and examples should show a working path with the
   smallest understandable amount of code. Product claims must be demonstrated, not merely
   asserted.
7. **Composable contracts:** every reusable component documents its inputs, outputs, states,
   accessibility behavior and failure behavior before implementation.
8. **Calm technical character:** visual hierarchy, whitespace and typography serve comprehension;
   decoration must not compete with code, demos or task completion.

## Mathematical design and token discipline

CKCSS's token layer (`src/tokens.css`) is the single source of numeric and chromatic truth. These
clauses turn principle 5 above into rules a linter or a reviewer can check mechanically.

1. **Base unit and spacing scale.** The spacing scale is generated from a **4px (0.25rem) base
   unit**: `--ck-space-1` … `--ck-space-10` resolve to 4, 8, 12, 16, 24, 32, 48, 64, 80, 96px.
   Every spacing value in margin, padding, gap and `inset` properties must be one of these
   tokens (or a `calc()`/multiple built from them). A raw pixel or rem literal for spacing is a
   constitutional violation, not a style preference — it breaks the base-unit guarantee that
   makes the whole surface visually coherent.
2. **No new spacing step without a token.** If a layout genuinely needs a value the scale
   doesn't have, the fix is to propose a new `--ck-space-*` step in `tokens.css` (still a
   multiple of 4px) via ADR, not to inline a one-off number. This keeps the scale closed and
   auditable.
3. **Color comes from semantic tokens, never raw hex.** Component and site CSS must reference
   `--ck-color-*` semantic tokens (`surface`, `text`, `primary`, `danger`, `success`, `warning`,
   `info`, `border`, `focus`, …), not the underlying `--ck-iznik-*` palette primitives directly
   and never a raw hex/rgb literal. Palette primitives exist to define semantics in
   `tokens.css`; component authors consume semantics.
4. **WCAG contrast is enforced, not reviewed by eye.** Every semantic text/background pairing
   must meet **≥ 4.5:1** for body text and **≥ 3:1** for large text (≥ 24px, or ≥ 19px bold) and
   non-text UI (focus rings, icon-only affordances), per WCAG 2.2 AA. `tests/token-contrast.mjs`
   in CKCSS already asserts this for the shipped semantic pairs. Any PR that adds or changes a
   semantic color token **must** add or update the corresponding assertion in that file — a
   token change without a passing contrast test does not merge.
5. **Focus indicators use the sanctioned dimensions only.** `--ck-focus-ring-width` (3px) and
   `--ck-focus-ring-offset` (3px) are the only permitted focus-ring geometry. Components must
   never remove or shrink `:focus-visible` styling; a custom control that reimplements focus
   styling must reproduce these exact values via the tokens, not approximate them.
6. **Radius, shadow, duration and easing are closed sets.** Use only `--ck-radius-{sm,md,lg,
   pill}`, `--ck-shadow-{sm,md,lg,none}`, `--ck-duration-{fast,standard,slow}` (160/240/420ms)
   and `--ck-ease-{standard,emphasis}`. No component-local `box-shadow`, `transition-duration` or
   `border-radius` literal.
7. **Type scale is closed.** Font sizes come from `--ck-font-size-{xs,sm,md,lg,xl,2xl,display}`
   only. `2xl` and `display` are already fluid (`clamp()`-based, see below); adding a new heading
   step means adding a new clamped token, not hand-picking a `px`/`rem` value at a call site.
8. **Documented exceptions require an ADR reference, inline.** The rare one-off value (e.g. a
   third-party embed's fixed pixel width) is permitted only with an inline CSS comment citing the
   ADR that recorded the reason. Undocumented literals are rejected in review; where feasible,
   CI should enforce this with a stylelint `declaration-property-value-disallowed-list` rule
   scoped to component/site CSS (raw hex/`rgb()` outside `tokens.css`; raw `px` for
   spacing/font-size outside `clamp()` definitions inside `tokens.css`).

## Fluid design and responsive contract

CKCSS already leans on `clamp()`, `minmax()`, `auto-fit` and container queries
(`.ck-query-container` / `@container`) rather than breakpoint proliferation. v2.0 makes that the
required default, not one option among several.

1. **Fluid typography by default.** Any heading- or display-scale token must be expressed as
   `clamp(min, preferred, max)`, following the existing pattern
   (`--ck-font-size-2xl: clamp(1.5rem, 3vw, 2rem)`, `--ck-font-size-display: clamp(2rem, 5vw,
   3.25rem)`). A fixed `rem` heading size paired with a media-query override to "fix" it at
   another breakpoint is not acceptable — express the whole range in one `clamp()`.
2. **Media queries are a last resort, not a first tool.** A breakpoint may be added only when
   `clamp()`, `min()`, `max()`, `minmax()`, `auto-fit`/`auto-fill`, or a container query cannot
   express the change — i.e. the layout structurally reorganizes (stacked → sidebar grid,
   3-column → 1-column), not merely resizes. Cosmetic scaling of size, spacing or gaps must never
   be gated behind a media query when a fluid function can express it.
3. **Component-level responsiveness prefers container queries over viewport media queries.**
   When a component's layout should respond to *its own* available width rather than the
   viewport (e.g. a card grid inside a narrow sidebar vs. full width), use
   `.ck-query-container` + `@container` (already shipped in `ckcss.css`), not a global
   `@media (min-width: …)`.
4. **Layout uses intrinsic sizing primitives first.** Prefer `.ck-grid--auto-fit` /
   `repeat(auto-fit, minmax(...))` and `.ck-cluster`/`.ck-stack` flex primitives over hardcoded
   column-count breakpoints. The canonical breakpoints already in use (`40rem`/640px,
   `48rem`/768px, `64rem`/1024px) are the only sanctioned viewport thresholds when a true
   structural media query is justified under rule 2 — do not introduce new arbitrary breakpoint
   values.
5. **Touch targets are non-negotiable and non-fluid.** Interactive controls never scale below
   `--ck-control-height-sm` (2.25rem / 36px minimum hit area, 44×44px effective with padding);
   the default control height is `--ck-control-height-md` (2.75rem). Fluid scaling of
   surrounding layout must never shrink a control below this floor at any viewport.
6. **Verification matrix.** A component is not "responsive by default" until manually verified,
   fluidly (i.e. by resizing, not just checking fixed checkpoints), across 320px, 375px, 640px,
   768px, 1024px, 1440px and 1920px, with no added breakpoint required to look intentional at any
   width in between.
7. **Reduced motion is part of the fluid contract.** Every animation/transition must respect
   `@media (prefers-reduced-motion: reduce)` — CKCSS's base layer already applies a global
   near-zero-duration override; component-local animations (e.g. `.ck-skeleton`) must disable
   themselves explicitly under the same query rather than relying on the global override alone.

## AI and developer contract (anti-drift enforcement)

This section binds AI coding agents (including Claude Code sessions operating in this repo) and
human developers to the same enforcement standard. Its purpose is to stop drift — small,
individually-reasonable deviations that compound into an inconsistent system.

1. **No invented tokens, ever.** An agent or developer must not introduce a new spacing, color,
   radius, shadow, duration, easing or font-size *value* by writing a literal. The only two legal
   moves are: (a) use an existing `--ck-*` token, or (b) propose a new token via ADR and add it to
   `tokens.css` *before* it is consumed elsewhere. A visual value that exists only inline in a
   component or page is a defect, full stop — not a style nit to fix later.
2. **No invented architecture.** Agents must not introduce new component APIs, class-name
   prefixes (`ck-*` is CKCSS's, `dv-*`/`dv:*` is DevinimJS's — see "Naming and ownership" in
   `docs/design-system.md`), state-management patterns, or file/folder conventions that are not
   already present in `tokens.css`, `docs/design-system.md`, an existing component, or an
   approved ADR. When a real gap is found, the correct action is to name it and propose an ADR —
   not to quietly improvise a plausible-looking solution.
3. **Self-verification before "done."** Any AI-authored change touching visual output (CSS,
   component markup, tokens) must, before being presented as complete, state explicitly which
   `--ck-*` tokens were used for spacing/color/type/radius/shadow/motion, and confirm no raw
   literal was introduced. If a change cannot be justified against the Token Discipline or Fluid
   Design clauses above, it is not done.
4. **YAGNI applies with extra force to agents.** Per §2's 3-pass rule: an agent must not add
   abstraction layers, configuration options, new dependencies, or "future-proofing" surface area
   beyond what the literal task requires. A diff that introduces a file, token, component, or
   config knob not necessary for the stated task is non-compliant and must be trimmed before it
   is presented as a candidate change — this is the single most common way AI-generated diffs
   drift from a hand-written one.
5. **Security and safety gates are not skippable by an agent.** Any use of `unsafe()` or an
   HTML-injection-equivalent pattern requires a security-review note in the PR description,
   exactly as §8 requires for human authors. An agent must not "helpfully" work around this by
   avoiding the review step.
6. **Build-free and performance boundaries are checked, not assumed.** Before proposing a change,
   verify it against "DevinimJS build-free boundary" (no new npm runtime dependency, no
   build-required syntax) and "Performance and shared-hosting guarantees" (size budget) above.
   State the `npm run size` delta explicitly when the change touches `src/core/` or a shipped
   component.
7. **Traceability.** Every AI-authored commit or PR must be traceable to a task or ADR id,
   consistent with the existing swarm workflow (bounded-task-contract, isolated-worktree
   implementer, human merge approval). Unattributed drive-by architecture or token changes are
   not acceptable regardless of author.
8. **Constitutional-tier files require human merge approval.** `constitution.md`,
   `docs/design-system.md`, and `tokens.css` (in CKCSS) cannot be self-merged by an agent under
   any autonomy setting — a human must review and approve changes to these files specifically,
   even when other changes in the same task are pre-approved for autonomous merge.
9. **When this constitution and a request conflict, the constitution wins.** If a user or task
   instruction would require violating a clause above (e.g. "just hardcode this color for now"),
   the correct response is to say so explicitly and propose the compliant alternative (add/reuse
   a token), not to silently comply and note it as a "temporary" exception — temporary exceptions
   are how drift starts.

Changes to these principles require an ADR or an explicit constitutional amendment. Use the
design-system document for operational guidance and page-specific redesign specs for content
and information architecture.

If this file and the canonical constitution diverge, the canonical source wins.
Amendments follow the process defined in the constitution itself.
