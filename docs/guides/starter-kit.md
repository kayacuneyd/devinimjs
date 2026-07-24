# Starter Kit

Bootstrap a working DevinimJS project with one command instead of hand-assembling files from the
README snippet.

```bash
node scripts/create-project.mjs <target-dir> [--format=static|php] [--dry-run] [--force]
# or, from a DevinimJS working copy:
npm run create:project -- <target-dir> [--format=static|php] [--dry-run] [--force]
```

- `<target-dir>` — where the starter is written (created if missing).
- `--format=static` (default) — a plain `index.html`, no server required.
- `--format=php` — an `index.php` that prints the counter's initial state server-side, matching
  [`docs/guides/php-integration.md`](php-integration.md).
- `--dry-run` — print the files that would be created without writing anything.
- `--force` — overwrite files that already exist at the destination (refused by default).

## What you get

```
<target-dir>/
  index.html               (or index.php)
  assets/devinim/authoring.min.js
  assets/devinim/components/dv-counter.js
```

`assets/devinim/authoring.min.js` and `assets/devinim/components/dv-counter.js` are exact copies
of this repo's own committed `dist/authoring.min.js` and `dist/modules/dv-counter.js` — the same
minified, self-hosted artifacts described in the
["Self-hosted"](php-integration.md#1-install-choose-one) install path. Nothing is rebuilt or
bundled at generation time or inside the generated project: copy the folder to any static file
host or PHP-capable shared host and it works, per the
[build-free compatibility contract](../../README.md#build-free-compatibility-contract).

## Try it

**Static:**

```bash
node scripts/create-project.mjs /tmp/my-app --format=static
cd /tmp/my-app && npx serve .   # or any static file server
```

**PHP:**

```bash
node scripts/create-project.mjs /tmp/my-app --format=php
cd /tmp/my-app && php -S localhost:8000
```

Open the served page and you get a working `<dv-counter>` — a self-contained, `data-*`-configured
component with increment/decrement buttons and a live count, wired end-to-end with no build step.

## Next steps

- Add more components by copying further `dist/modules/*.js` files into
  `assets/devinim/components/` (each imports `../authoring.min.js` or `../core.min.js` relatively
  — keep the two-level folder layout). Every `dist/modules/*.js` file is self-contained as of
  ADR-0020 — no other file needs to come with it, **except** `dv-data-table.js`, which also needs
  `dv-pagination.js` copied alongside it (it composes `<dv-pagination>` internally as a real
  sibling file, not a bundled copy — see ADR-0020's consequences for why).
- Read [`docs/guides/php-integration.md`](php-integration.md) for the full `data-*` contract,
  JSON attributes, events and the security checklist.
- Read [`docs/guides/authoring-api.md`](authoring-api.md) to write your own `.dv.js` components.

## Kits — a working page, not just one component

`--format` scaffolds a blank page with one component. `--kit=<name>` scaffolds a **working page**
composing several real components with a CKCSS pattern — the fastest way to get a real screen
without writing one from scratch:

```bash
npm run create:project -- <target-dir> --kit=admin-dashboard
```

`--kit` and `--format` are mutually exclusive — a kit is always a static, build-free page. See
[`kits/README.md`](../../kits/README.md) for the kit list and rules, and
[`kits/admin-dashboard/README.md`](../../kits/admin-dashboard/README.md) for what that one
demonstrates (search/sort/paginate, a create-via-modal flow, a delete-via-confirm flow, toast
feedback — all through each component's existing documented `data-*`/event contract, no new
framework feature). Design decision: [`adr/0020-starter-kits.md`](../../adr/0020-starter-kits.md).

## Not yet included

There is no `npx devinimjs create`/npm `bin` entry — see
[ADR-0016](../../adr/0016-starter-kit-cli.md) for why, and what would need to change to add one.
