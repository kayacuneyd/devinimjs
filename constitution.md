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

If this file and the canonical constitution diverge, the canonical source wins.
Amendments follow the process defined in the constitution itself.
