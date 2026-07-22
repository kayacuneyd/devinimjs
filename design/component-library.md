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

## `<dv-disclosure>` — shipped (unreleased)

Accessible show/hide content. `data-summary` labels its native button; `data-open` controls the
initial/live visibility. It emits `dv:toggle` with `{ open }` and preserves its light-DOM children.

---

## `<dv-modal>` — shipped (unreleased)

Light-DOM dialog with `data-label` and `data-open`. It emits `dv:open`/`dv:close`, focuses the
dialog when opening, restores its recorded opener when closing, and closes on Escape. Consumers
style `.dv-modal-backdrop`, `.dv-modal` and `.dv-modal-content` with their own global CSS.

---

## `<dv-toast>` — shipped (unreleased)

Live status message. Configure `data-duration` in milliseconds (`0` disables auto-dismiss) and
call `element.show('Saved')` or `element.hide()`. It emits `dv:show`/`dv:hide` and uses
`role="status"` with polite announcements.

---

## `<dv-pagination>` — shipped (unreleased)

One-based pagination for server-rendered or fetched lists. Attributes: `data-page`, `data-total`,
`data-size`, optional `data-label`. It emits `dv:page` with `{ page }`; Previous/Next are native
disabled controls at their boundaries.

---

## `<dv-field>` — shipped (unreleased)

A labelled native control for forms that want a small, predictable event API. Use
`data-control="input"`, `"textarea"` or `"select"`; selects accept JSON `data-options`.
Configure `data-name`, `data-label`, `data-type`, `data-value`, `data-placeholder`,
`data-required`, `data-disabled` and `data-error`. It emits `dv:input` and `dv:change` with
`{ value, valid }`. The surrounding form remains responsible for submission and persistence.

---

## `<dv-confirm>` — shipped (unreleased)

A two-step control for consequential actions. The first activation shows a message plus Confirm
and Cancel controls; the second emits `dv:confirm` with `{ value }`. Cancel emits `dv:cancel`.
Configure labels and value through `data-label`, `data-message`, `data-confirm-label`,
`data-cancel-label` and `data-value`.

---

## `<dv-autocomplete>` — shipped (unreleased)

An accessible local-data combobox. Give it a JSON `data-items` list and optionally a
`data-query`/`data-label`; it emits `dv:query` as the user types and `dv:select` with
`{ value }` after a choice. Application code owns remote fetching and replaces `data-items`.

---

## `<dv-data-table>` — shipped (unreleased)

A small semantic table for already-loaded JSON. `data-columns` accepts strings or
`{ key, label }` objects, `data-rows` accepts objects and `data-label` labels the table.
Column headers sort rows locally and emit `dv:sort` with `{ key, direction }`.

---

## `<dv-cart>` — shipped (unreleased)

A presentational cart for page-owned data. Supply JSON `data-items` or call `setItems(items)`;
it emits `dv:change` with current items/total and `dv:remove` with `{ id }`.

---

## `<dv-toast-stack>` — shipped (unreleased)

Page-level notification queue. Call `show(message)` and optionally `dismiss(id)`; each message
uses a polite live region and emits `dv:show`/`dv:hide`.

---

## `<dv-state>` — shipped (unreleased)

Explicit `loading`, `empty` and `error` state indicator. Error renders a retry button that emits
`dv:retry`; the page owns requests and retries.

---

## Consumer components

Your own components follow the identical contract. Reserve `dv-` for framework components;
pick your own prefix (e.g. `<acme-gallery>`) — `define()` only enforces the hyphen.
