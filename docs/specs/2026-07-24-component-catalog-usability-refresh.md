# DevinimJS component catalog usability refresh

## Goal

Turn the Components page into a calm, copyable implementation reference: every card should make its contract, interactive demo, event result and paste-ready usage easy to distinguish.

## Source inventory

- Keep: component taxonomy, live custom-element demos, event feedback and native controls.
- Rewrite: dense inline contracts, ungrouped demo controls, exposed raw snippets and modal close styling.
- Drop: full-width/visually dominant demo actions where an intrinsic compact control communicates the action better.

## Target sitemap

No route changes. The work is scoped to `/components/` and the shared responsive shell.

## Page responsibilities

- Header: icon-led, accessible mobile navigation toggle.
- Component card: category, concise contract, demo surface, concise event feedback and collapsible usage source.
- Code bar: native disclosure plus a one-click copy action; source remains present in the HTML before JavaScript.
- Modal: a labelled icon button with a generous, consistent hit target; opening and closing must preserve existing focus behavior.

## Reusable content

- A `details`-based code disclosure with a compact Copy action is generated for every catalog component card.
- A shared demo-surface treatment groups live controls without changing component behavior.
- A shared event-result treatment distinguishes feedback from explanatory copy.

## Content to drop or rewrite

- Replace repeated “Input / State / Event” prose with a smaller muted contract line.
- Hide raw usage source behind a labelled toggle rather than leaving it as a competing visual block.

## SEO and redirects

No URL, title, canonical, sitemap or redirect change.

## Visual direction

- Use the existing CKCSS closed scale: large radius for cards, medium radius for buttons and code panels, small radius for native control internals.
- Use compact controls (`--ck-control-height-sm`) and `--ck-space-2/3/4/5` only.
- Use simple inline SVG icons only where an icon improves recognition: menu, copy, close and code disclosure.

## Implementation notes

- Keep all code sources in the DOM and use progressive enhancement for Copy.
- Do not alter `dv-modal` focus trapping, Escape handling or events; only improve its visual adapter and accessible label.
- Verify component filter, modal focus/close behavior, mobile menu, copy behavior, overflow and Axe checks.

## Open questions

None for this iteration; the reference page keeps its existing English content and component contract scope.
