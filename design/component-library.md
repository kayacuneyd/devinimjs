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

## `<dv-tabs>` — shipped (v0.1)

**Purpose:** accessible tabbed interface; the WCAG AA proof (WAI-ARIA APG tabs pattern).

| Attribute | Type | Default | Notes |
|-----------|------|---------|-------|
| `data-active` | number | `0` | active tab index; live-synced, clamped to range |
| `data-label` | string | `"Tabs"` | accessible name of the tablist (`aria-label`) |

**Children API:** each light-DOM child becomes one tabpanel; its `data-tab` attribute is the
tab label (fallback `Tab N`). The component manages `hidden`/ARIA on panel children
(documented exception to "outlet content is consumer-owned").

**Events:** `dv:tab` — `detail: { index }`, after every activation change.

**Methods:** `activateIndex(index)` (programmatic); template directives `activate`, `onKeydown`.

**States:**

- *Default:* active tab `aria-selected="true"`, its panel visible; others `hidden`.
- *Edge:* empty tabset renders an empty tablist; out-of-range `data-active` clamps.
- *Focus:* automatic activation — arrow keys move selection **and** focus together.

**Accessibility:** `role=tablist/tab/tabpanel`, `aria-controls`↔`id`, `aria-labelledby`,
roving `tabindex` (active `0`, others `-1`), ArrowLeft/ArrowRight with wrap-around, Home/End —
per the ARIA Authoring Practices Guide. Unique ids across multiple instances.

**Example:** `examples/tabs.html`.

---

## Consumer components

Your own components follow the identical contract. Reserve `dv-` for framework components;
pick your own prefix (e.g. `<acme-gallery>`) — `define()` only enforces the hyphen.
