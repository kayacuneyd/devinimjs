# DevinimJS + CKCSS Design System

## Purpose

This document turns the product principles in `constitution.md` into working rules for the
DevinimJS ecosystem and its public documentation site. It describes a shared language, not a
visual copy of Airbnb or any other product. CKCSS remains the source of truth for visual tokens;
DevinimJS adds interaction contracts and application states.

## Product model

```text
Semantic HTML      content and structure
CKCSS              presentation, layout, tokens and responsive foundations
DevinimJS          interaction, state, async behavior and component lifecycle
Backend/API        persistence, identity, authorization and domain rules
```

Each layer should be independently understandable. A DevinimJS component may enhance a CKCSS
pattern, but it must not make the visual layer dependent on a particular backend.

## Design principles

### 1. Explainable before impressive

Every screen has one primary job. The first viewport should answer what the product is, who it is
for and what the next action is. Code examples should be copyable and runnable.

### 2. Calm technical clarity

Use strong typography, clear spacing, restrained color and purposeful emphasis. Avoid decorative
gradients, excessive cards, animated hero content and visual noise that competes with code or
documentation.

### 3. Content, presentation and behavior stay separate

Use semantic HTML for content, CKCSS classes/tokens for presentation and DevinimJS components for
behavior. Do not duplicate state ownership between a CKCSS enhance module and a DevinimJS
component on the same element.

### 4. Responsive is a behavior contract

The interface must work at narrow mobile widths, touch widths, tablet widths and wide desktop
widths. Layout should prefer `clamp()`, `min()`, `max()`, `ch`, `minmax()` and `auto-fit` before
adding a breakpoint. Code and data-heavy content must have an intentional small-screen mode.

### 5. Accessibility is part of the component API

Every interactive component documents labels, roles, focus movement, keyboard behavior, live
regions, disabled/loading states and reduced-motion behavior. Native controls are preferred.

## Visual language

### Tokens

Use CKCSS semantic tokens for color, typography, spacing, borders, radius, elevation and motion.
Site-specific additions belong in a small site theme layer and must be named as semantic aliases,
not raw palette values.

### Typography

Headings create a clear reading hierarchy; body copy favors readable line length; code uses a
monospace face with visible distinction from prose. Technical pages should use a two-column layout
only when the viewport supports it: navigation/content, not cramped three-column grids.

### Surfaces

Use surfaces to group related tasks, not to turn every section into a card. Primary actions use
the CKCSS button hierarchy. Secondary actions should not visually compete with the page's main
task.

### Motion

Motion communicates state changes and spatial relationships. It must be short, interruptible and
disabled or reduced under `prefers-reduced-motion`. Never use auto-rotating content as the only
way to discover information.

## Interaction contracts

Reusable components must define:

- inputs and defaults;
- emitted events and their payloads;
- loading, empty, error and success states;
- keyboard and focus behavior;
- cleanup behavior when disconnected;
- safe handling of untrusted content.

The preferred DevinimJS contract remains `component()` for ordinary components and
`BaseComponent` for advanced lifecycle or DOM integration needs.

## Documentation site rules

- Every major claim has a live or copyable example.
- Installation works from a static HTML file with pinned assets.
- Tutorial lessons progress from a visible result to the underlying contract.
- Docs pages expose page context, local navigation and a clear next step.
- Code blocks scroll on small screens; they never force the entire page wider than the viewport.
- Turkish and English content share the same information architecture and canonical URL policy.
- Legal, security, contact and licensing information is easy to find from the footer.

## Quality gates

Before a page or component is considered ready:

- it is checked at mobile, tablet and desktop widths;
- keyboard navigation completes the primary task;
- focus is visible and not trapped unexpectedly;
- contrast and semantic landmarks are valid;
- reduced motion is respected;
- code examples run from the documented installation path;
- no page depends on an unpinned CDN asset;
- loading, empty and error states are intentional.

## Naming and ownership

CKCSS owns `ck-*` classes and tokens. DevinimJS owns `dv-*` custom elements and `dv:*` events.
Site-only classes use a site prefix and must not silently become framework API. A visual change to
CKCSS belongs in CKCSS; an interaction or state change belongs in DevinimJS; a page/content change
belongs in the site project.
