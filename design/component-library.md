# Component Library — DevinimJS

Inventory, API surfaces and states (constitution §1.1/§1.2). Every framework component must be
documented here before it ships. Styling comes from CKCSS/global CSS — components ship unstyled
except structural resets (`<dv-outlet> { display: contents }`).

## Conventions recap (ADR-0006)

`src/components/dv-kebab.js` → `class DvPascal extends BaseComponent` → `define('dv-kebab', DvPascal)`.
Config: `data-*` attributes. Outbound events: `dv:*`. Methods: plain verbs.

---

## `<dv-counter>` — shipped (v0.1)

**Purpose:** numeric stepper; the reference component for the whole architecture.

| Attribute | Type | Default | Notes |
|-----------|------|---------|-------|
| `data-start` | number | `0` | initial count; live-synced via `onAttribute` |
| `data-step` | number | `1` | increment/decrement step; live-synced |

**Events:** `dv:change` — `detail: { count }`, after every change.

**Methods (template directives):** `increment()`, `decrement()`.

**States:**

- *Success (default):* current count in an `<output aria-live="polite">`.
- *Empty/loading/error:* not applicable (all input arrives via attributes with fallbacks).

**Accessibility:** buttons carry `aria-label`s; the value region announces changes politely;
fully keyboard-operable (native `<button>`s).

**Example:** `examples/counter.html`, `examples/counter.php`.

---

## `<dv-tabs>` — planned (next milestone, ADR-0010)

**Purpose:** the accessibility proof — WAI-ARIA tabs pattern.

| Attribute | Type | Default | Notes |
|-----------|------|---------|-------|
| `data-active` | number | `0` | initially active tab index |

**Planned events:** `dv:tab` — `detail: { index }`.

**Planned states:** default (active panel), edge (first/last with arrow-key wrap-around).
**Accessibility target:** `role=tablist/tab/tabpanel`, `aria-selected`, arrow/Home/End keys,
`tabindex` management per the ARIA Authoring Practices Guide.

---

## Consumer components

Your own components follow the identical contract. Reserve `dv-` for framework components;
pick your own prefix (e.g. `<acme-gallery>`) — `define()` only enforces the hyphen.
