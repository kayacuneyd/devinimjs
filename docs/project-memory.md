# DevinimJS project memory

- 2026-07-22: Project root is `/var/www/devinimjs`; the static site document root is `site/`.
- 2026-07-22: Public site structure is bilingual and static: `/en/`, `/tr/`, `/en/docs/`, `/tr/docs/`, `/en/components/`, `/tr/components/`, `/en/tutorials/`, `/tr/tutorials/`.
- 2026-07-22: Site presentation uses pinned CKCSS `v0.1.0-beta.1` and DevinimJS `v0.5.1` CKCSS integration; page behavior uses real DevinimJS CDN modules.
- 2026-07-22: AI documentation lives at `site/llms.txt`, `site/llms-full.txt`; component metadata source is `docs/component-manifest.json`.
- 2026-07-22: Local verification commands are `npm run verify`, `npm run build`, and `npm run serve -- --port 8898` for site checks.
- 2026-07-22: `npm test` was corrected to use `node --test tests/unit/*.test.js` without quoting the shell glob.
- 2026-07-22: Latest launch verification passed: key public routes returned 200, 85 unit tests and 19 Playwright/Axe E2E tests passed, and the 4 KB core gzip size gate passed.
- 2026-07-22: Nginx vhost `/etc/nginx/sites-available/devinimjs.digitaltamam.com` is enabled and serves `/var/www/devinimjs/site`; HTTP redirects to HTTPS.
- 2026-07-22: Let’s Encrypt certificate `/etc/letsencrypt/live/devinimjs.digitaltamam.com/` is active through 2026-10-20 and Certbot renewal is scheduled.
- 2026-07-22: The public component manifest is exposed at `/docs/component-manifest.json` through `site/docs/component-manifest.json` symlink.
- 2026-07-22: Experimental v0.6 AI-first authoring is exposed from `src/core/authoring.js` (`component`, `html`, `unsafe`); `.dv.js` files are ordinary browser ESM and must stay compiler-free.
- 2026-07-22: `component()` maps its compact `props` contract to typed live `data-*` attributes; prefer `on:event="action"` for new components, while `data-on:event` remains compatible.
- 2026-07-22: The authoring distribution is `dist/authoring.min.js`; the generator supports `npm run create:component -- tag-name --format=dv` and the full verification result is 85 unit plus 19 Playwright/Axe E2E tests.
- 2026-07-22: The built authoring distribution is copied to `site/assets/authoring.min.js`; bilingual docs load `site/assets/authoring-demo.dv.js` as a real browser-direct demonstration.
- 2026-07-22: Public verification for `https://devinimjs.digitaltamam.com/en/docs/` confirmed HTTPS redirect, matching certificate, successful authoring demo at desktop/mobile widths, no console errors and no horizontal overflow.
