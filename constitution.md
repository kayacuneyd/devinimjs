# Engineering Constitution

This project is governed by the **KayaEOS Engineering Constitution**:

- Canonical source: <https://github.com/kayacuneyd/kayaengineeringos/blob/main/constitution.md>
- Adopted version: **1.0.0** (2026-07-19)

All playbooks, ADRs, code reviews and AI-assisted workflows in this repository derive from, and
must not contradict, that constitution. Key bindings for daily work:

- §1 Design first — components, states and tokens before code.
- §2 Simplicity — YAGNI, 3-pass rule, no premature abstraction.
- §3 Quality gates — tests, review, lint are non-negotiable.
- §5 Progressive enhancement — **deliberately waived for DevinimJS components**; see ADR-0001.
- §8 Security — never trust input; `unsafe()` usage requires security review.
- §9 Performance — core < 4 KB min+gzip; measure before optimizing.
- §10 SemVer + Keep-a-Changelog.

If this file and the canonical constitution diverge, the canonical source wins.
Amendments follow the process defined in the constitution itself.
