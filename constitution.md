# Engineering Constitution

This project is governed by the **KayaEOS Engineering Constitution**:

- Canonical source: <https://github.com/kayacuneyd/kayaengineeringos/blob/main/constitution.md>
- Adopted version: **1.0.0** (2026-07-19)

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
4. **Accessible by default:** native controls, visible focus, semantic landmarks, readable
   contrast, reduced-motion support and keyboard-complete interaction are release requirements.
5. **Token-led design:** colors, type, spacing, radii, elevation and motion come from CKCSS
   tokens or documented aliases; one-off visual values require a recorded reason.
6. **Explainable interfaces:** documentation and examples should show a working path with the
   smallest understandable amount of code. Product claims must be demonstrated, not merely
   asserted.
7. **Composable contracts:** every reusable component documents its inputs, outputs, states,
   accessibility behavior and failure behavior before implementation.
8. **Calm technical character:** visual hierarchy, whitespace and typography serve comprehension;
   decoration must not compete with code, demos or task completion.

Changes to these principles require an ADR or an explicit constitutional amendment. Use the
design-system document for operational guidance and page-specific redesign specs for content
and information architecture.

If this file and the canonical constitution diverge, the canonical source wins.
Amendments follow the process defined in the constitution itself.
