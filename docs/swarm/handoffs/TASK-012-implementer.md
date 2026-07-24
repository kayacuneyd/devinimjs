# TASK-012 handoff

## Changed

- `site-next/assets/css/site.css`
  - Scoped the inherited navigation color to `.dv-nav a:not(.ck-button)` so CKCSS primary
    buttons retain their accessible `--ck-color-on-primary` text color.
  - Added site-scoped CKCSS primary button tokens with accessible light/dark values:
    light `#075985`/`#ffffff` and dark `#8bd5ff`/`#082433`, including hover values.
  - Calculated text contrast is 7.56:1 (light), 9.97:1 (dark), with hover ratios above 9:1.
  - Mobile-first header/navigation layout with a 44px-equivalent minimum touch target.
  - Responsive hero and docs layouts at 40rem/48rem breakpoints.
  - Visible `:focus-visible` treatment for links and controls.
  - Reduced-motion handling retained and extended to smooth scrolling/transitions.
  - Narrow-viewport overflow protection for the page, media, grid children and code blocks.
  - Static navigation remains available on small screens instead of hiding its links.
- `site-next/assets/js/site.js`
  - Added the repo-consistent `/* global document, window */` declaration so the browser shell
    passes the lint gate without changing runtime behavior.
  - Mobile menu now updates `aria-expanded` and `data-open`, moves focus to the first link,
    closes on Escape, outside click and link activation, returns focus to the toggle, and
    resets after switching to desktop.
  - Existing counter demo behavior is unchanged.

## Checks

- `node --check site-next/assets/js/site.js` — passed.
- `npm run lint` — passed; the previous `document`/`window` no-undef findings are resolved.
- `npm run test:e2e -- tests/e2e/site-next.spec.js` — passed: 7 tests, including route loading,
  mobile/desktop overflow, homepage interaction and axe WCAG A/AA scans for homepage and
  component catalog.
- Follow-up contrast finding — resolved by the selector scope correction above; the rerun passed
  all 7 site-next tests, including the homepage and component catalog axe scans.
- Focused static check — passed for all 20 HTML pages currently present under `site-next/`:
  viewport metadata, `#main` targets, focus/reduced-motion/overflow/touch hooks, and
  navigation/counter/global hooks.
- Scoped diff inspection confirmed this task touched only the two TASK-012 ownership files and
  this required handoff; pre-existing worktree changes were left untouched.

## Open questions

- The current axe coverage is on the homepage and component catalog; a future full-site axe pass
  can cover every legal, documentation and tutorial route before launch.
- The static pages currently use the pinned CKCSS CDN stylesheet; final deployment should verify
  that its button/link focus styles do not conflict with the site focus ring.
