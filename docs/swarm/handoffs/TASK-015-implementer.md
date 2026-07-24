# TASK-015 implementer handoff

## Status

Implemented the trust-page pass and the first Turkish route set within the exclusive TASK-015 paths.

## Changed paths

- Improved English `about`, `contact`, `security`, `privacy`, `terms` and `license` pages.
- Added Turkish equivalents for:
  - `/site-next/tr/`
  - `/site-next/tr/about/`
  - `/site-next/tr/docs/`
  - `/site-next/tr/tutorials/`
  - `/site-next/tr/contact/`
  - `/site-next/tr/security/`
  - `/site-next/tr/privacy/`
  - `/site-next/tr/terms/`
  - `/site-next/tr/license/`

No shared CSS/JS, other English content pages, constitution, specs or legacy site files were edited.

## Trust and factuality decisions

- Privacy and terms are explicitly marked as draft placeholders and list the missing operator, jurisdiction, processing, retention and effective-date facts.
- Security reporting is explicitly marked as incomplete; no private reporting address or response commitment was invented.
- Contact page uses the existing public DevinimJS GitHub repository and labels direct-contact details as an unconfirmed placeholder.
- About page avoids asserting a company, legal entity or support organization.
- License page limits the confirmed MIT claim to the DevinimJS repository license file and asks consumers to verify CKCSS and third-party notices separately.

## Verification evidence

- Local-link checker scanned 20 HTML files under `site-next`; result: `local relative links: OK`.
- Static server smoke test (`node scripts/serve.mjs --port 8091`) returned HTTP `200` for all English trust routes and all added Turkish routes.
- Turkish documents use `lang="tr"` and nested stylesheet paths resolve to `../../assets/css/site.css`.

## Open questions before production

1. Who is the legal/operator entity for the site and what verified postal/email contact should be published?
2. Which hosting, CDN, analytics, cookies, logging and error-reporting services are actually enabled?
3. What jurisdiction, privacy-rights process, retention schedule and effective dates apply?
4. What private security reporting channel and response/disclosure policy should be published?
5. Is CKCSS distributed under the same MIT terms, and which third-party notices must accompany the site assets?
6. Should the Turkish pages receive formal legal translation/review before launch?

