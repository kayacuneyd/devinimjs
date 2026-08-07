# ADR-0022: Rule-based form validation (`validate` + `createForm.validate`)

- **Status:** Accepted
- **Date:** 2026-08-07
- **Deciders:** Cüneyt Kaya
- **Constitution links:** §2.1 (YAGNI), §8 (never trust input)
- **Fulfills:** roadmap §1.6

## Context

The roadmap's form story (`dv-validate` / `dv-error` declarative attributes) needs a validation
engine whose rule vocabulary mirrors CI4's, so client-side messages and server-side
`failValidationErrors()` responses render through one error path. `createForm` shipped without
any validation hook.

## Decision drivers

- Same error shape on both sides: `{ field: message }` — the template branch never changes.
- The rule list is exactly the roadmap's: required, email, url, number, min, max, minLength,
  maxLength, pattern, match — nothing more (YAGNI).
- Client validation is a convenience, never a security boundary (§8): CI4 re-validates always.

## Decision

1. **`validate(values, rules, messages?)`** (new `core/validate.js`, exported via
   `core/app.js`). Rules are pipe strings (`'required|number|min:18'`) or arrays; a rule takes
   one optional argument after the first colon. Returns the **first** error per field.
2. **Optional fields stay optional:** a field without `required` whose value is empty skips its
   remaining rules.
3. **Messages:** overrides resolve `'<field>.<rule>'` → `'<rule>'` → built-in English default;
   Turkish apps pass their own map (params-over-bundles i18n stance, ADR-0019).
4. **`createForm.validate(rules, messages?)`** runs the validator over `state.values`; on
   failure it writes `state.errors` + `status: 'error'` (identical to the server-error path)
   and returns `false`; on success it clears errors and returns `true`.
5. **Templates stay declarative without new directive syntax:** submit is
   `data-on:submit:prevent="save"`; error display is `${this.state.errors.email}` — no new
   template grammar was needed, so the roadmap's `dv-validate`/`dv-error` attributes were
   deliberately not invented (constitution: no invented component APIs without an ADR).
6. Unknown rules warn and are skipped (a typo must not silently pass a form).

## Considered alternatives (rejected)

- Declarative `dv-validate` DOM attributes scanned by the runtime — duplicates what authors
  already express in the action, adds a scanning lifecycle and a second source of truth.
- HTML5-constraint-only validation — cannot express `match:` or cross-field rules.

## Consequences

**Positive:** one validator for forms and CMS dynamic fields; server/client share error shape.
**Negative / to manage:** `pattern:` arguments cannot contain `|` (documented in the module).
