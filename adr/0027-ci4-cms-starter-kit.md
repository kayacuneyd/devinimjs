# ADR-0027: CI4 + SQLite CMS starter kit (`kits/ci4-cms/`)

- **Status:** Accepted
- **Date:** 2026-08-07
- **Deciders:** Cüneyt Kaya
- **Constitution links:** §2.1 (YAGNI), §8 (security), §9 (shared-hosting guarantees)
- **Fulfills:** roadmap Bölüm 2 (§2.1–§2.10) and its ADR-001…ADR-006

## Context

The roadmap's second half is a full CMS: CodeIgniter 4 backend, SQLite storage, session auth,
dynamic content types, media library, plugin system and themes. Shipping it as a **kit** (an
overlay of `app/` files plus README) keeps the runtime repo build-free while giving projects a
runnable starting point over `codeigniter4/appstarter`.

## Decision

The kit implements the roadmap verbatim; the roadmap's own ADRs are adopted by reference:

1. **Light DOM + CKCSS in themes** (roadmap ADR-001) — no Shadow DOM anywhere.
2. **Routing split** (roadmap ADR-002): public site uses CI4 server-side routing for SEO;
   `/admin` is a DevinimJS hash-router SPA mounted by `AdminController::index` →
   `Views/admin/shell.php` (`createHashRouter().mount()` + `bindRouterLinks`, ADR-0023).
3. **SQLite default, MySQL optional** (roadmap ADR-003): `Config/Database.php` uses the
   SQLite3 driver against `writable/database.sqlite`; `Config/Boot/production.php` sets
   `PRAGMA journal_mode=WAL` + `synchronous=NORMAL`; `php spark db:backup` (CLI command)
   copies the single file.
4. **Custom session auth, not Shield** (roadmap ADR-004): `AuthController` +
   `Filters/ApiAuthFilter` (401 JSON with `login_url`); password via `password_hash`/`password_verify`.
5. **JSON field storage, not EAV** (roadmap ADR-005): `contents.data` is JSON (CI4
   `$casts = ['data' => 'json']`), schema metadata lives in `content_types` + `fields`;
   `Libraries/Fields/*` render and validate per field type.
6. **Plugin sandbox = namespace isolation + hooks** (roadmap ADR-006):
   `Libraries/PluginLoader` boots `app/Plugins/*` from `plugin.json` manifests;
   `Libraries/Hook` provides `on`/`trigger` (`content.before_save`, …). No `eval`, plugins
   keep to their own namespace — "safe enough" for shared hosting.
7. **API layer:** `Api/BaseApiController` (AJAX-only + session guard + CSRF-header check),
   resource controllers for posts/pages/media/users/content-types with
   `{ data, meta: { page, limit, total } }` list envelopes — matching `createApi` (ADR-0021)
   and `HttpError.body.errors` (ADR-0022) on the JS side.
8. **Security per roadmap §2.10:** query builder only, `esc()` on all view output, CSRF meta +
   header, upload MIME/extension/size validation, session filter on the `api` group.

## Consequences

**Positive:** a complete CMS is a `composer create-project` + overlay + `spark migrate/seed`
away; every kit PHP file is `php -l`-gated.
**Negative / to manage:** the kit tracks CI4 minor releases manually; MySQL remains a
documented switch, not a tested path (YAGNI until requested).
