# ADR-0024: Application-level i18n catalog (`createI18n`)

- **Status:** Accepted (amends [ADR-0019](0019-i18n-locale-primitive.md))
- **Date:** 2026-08-07
- **Deciders:** Cüneyt Kaya
- **Constitution links:** §2.1 (YAGNI), §9.3 (budgets — lives outside the gated core barrel)
- **Fulfills:** roadmap §1.10

## Context

ADR-0019's primitive translates *component-owned* copy through per-tag bundles. Applications
(the CMS admin, a themed public site) need *page-owned* copy: one catalog, a fallback locale,
interpolated and pluralized messages, and a language switch that re-renders everything.

## Decision

1. **`createI18n({ locale, fallbackLocale, messages })`** lives in `core/i18n.js` (same module
   as the primitive, reusing its `interpolate` and locale resolution) and is exported via
   `core/app.js`.
2. **Resolution:** active-locale entry → `fallbackLocale` entry → the key itself (visible
   degradation, mirroring the primitive's typo policy).
3. **Pluralization is pipe-based, selected before interpolation** when `params.count` is a
   number: two forms mean `one|other`, three or more mean `zero|one|other`. Turkish's
   count-independent nouns simply use a pipe-free entry — no CLDR machinery (YAGNI).
4. **`i18n.setLocale()` forwards to the primitive's module-level `setLocale()`**, so every
   component subscribed via `onLocaleChange()` re-renders on an app-level language switch —
   the roadmap's acceptance criterion — without a second listener registry.
5. No lazy-loaded bundles, no date/number formatting, no ICU MessageFormat.

## Considered alternatives (rejected)

- CLDR plural rules — an order of magnitude more code for languages this project ships (tr/en).
- Extending `registerLocales` bundles with plurals — component copy rarely pluralizes; app copy
  does. Separate mechanisms keep each simple.

## Consequences

**Positive:** roadmap §1.10's examples (`i18n.t('post_count', { count: 5 })`) work verbatim.
**Negative / to manage:** gendered/CLDR-exotic plural languages would need a follow-up ADR.
