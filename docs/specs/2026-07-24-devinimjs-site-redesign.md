# DevinimJS Site Redesign Spec

## Goal

Rebuild the public DevinimJS site as the clear, responsive and working reference for the
DevinimJS + CKCSS ecosystem. The site must teach the product, demonstrate it in motion and make
the build-free/shared-hosting promise credible within the first visit.

The existing site remains preserved in a separate legacy location and is used only as a content
and URL reference. The new site starts from a clean implementation.

## Source Inventory

The current repository contains English and Turkish home, docs, components and tutorial pages,
component demos, `llms.txt` references, sitemap/robots files and CKCSS-based site styles. CKCSS
provides the visual foundation, tokens, layout primitives, responsive patterns and a broad UI-kit
catalog including application, ecommerce and authentication patterns.

Keep as source material:

- product positioning and build-free contract;
- architecture, security, accessibility and application-runtime documentation;
- component contracts and live examples;
- tutorials that are technically correct after review;
- license, repository and release information.

Rewrite or expand:

- homepage narrative and proof sections;
- docs navigation and progressive learning path;
- tutorial sequencing and project-based outcomes;
- DevinimJS/CKCSS relationship;
- contact, about, security and legal information;
- responsive examples and full application demos.

Drop or avoid carrying forward:

- redirect-only landing shells where a real page can exist;
- duplicate navigation and stale version references;
- claims without a live example;
- pages whose only purpose is internal scaffolding or placeholder content.

## Target Sitemap

```text
/
├── about/
├── docs/
├── tutorials/
├── components/
├── examples/
├── ckcss/
├── changelog/
├── roadmap/
├── contact/
├── security/
├── privacy/
├── terms/
└── license/
```

Both `/en/` and `/tr/` use the same topology and page responsibilities. Language switching must
preserve the equivalent page whenever a translation exists.

## Page Responsibilities

| Page | One clear job |
|---|---|
| Home | Explain the ecosystem and get a visitor to a working demo or first import. |
| About | Explain the problem, project relationship and design philosophy. |
| Docs | Provide authoritative API and architecture reference. |
| Tutorials | Teach by building progressively larger applications. |
| Components | Let users inspect states, markup, events and live behavior. |
| Examples | Show complete patterns such as admin, ecommerce and editor interfaces. |
| CKCSS | Explain the presentation layer and how it pairs with DevinimJS. |
| Changelog/Roadmap | Make product maturity and direction visible. |
| Contact | Provide a reliable human/project contact path. |
| Security | Explain reporting, input safety and release expectations. |
| Legal pages | Provide privacy, terms, license and third-party notices. |

## Homepage narrative

1. Clear promise: reactive interfaces for the web already deployed.
2. Three-layer model: HTML, CKCSS and DevinimJS.
3. Live interaction demo.
4. Build-free installation with pinned assets.
5. Real application examples, not only counters.
6. Accessibility, security and performance proof.
7. Learning paths for first-time users, PHP developers and advanced authors.
8. Final calls to action: start tutorial, read docs, browse components.

## Tutorial model

Tutorials progress through outcomes:

1. First component
2. Reactive state and events
3. Forms and validation
4. Shared state
5. Async API data
6. Tables, filtering and CRUD
7. Product catalog and cart
8. CKCSS + DevinimJS application shell
9. WYSIWYG editor foundations
10. Deployment on static/shared hosting and VPS

Every lesson includes a live result, source code, explanation, accessibility note, security note,
and a small exercise. Tutorials should reuse the same design system and project conventions as the
site itself.

## Responsive and accessibility requirements

- mobile-first layouts with content-driven breakpoints;
- no horizontal page overflow at narrow widths;
- intentional mobile modes for docs sidebars, tables, code, navigation and demos;
- keyboard-complete primary flows and visible focus;
- WCAG-oriented contrast and semantic landmarks;
- `prefers-reduced-motion` support;
- touch targets appropriate for mobile use;
- screenshots or browser checks at representative narrow, tablet and desktop widths.

## Implementation Notes

The new site should be a clean static consumer of CKCSS and DevinimJS. It may use development-time
scripts for validation or content generation, but published pages must remain deployable by copying
HTML, CSS and JavaScript to shared hosting. The site should use CKCSS for presentation and
DevinimJS for interactive demos, navigation enhancements, components and stateful examples.

Do not delete or overwrite the legacy site during implementation. Create the new site in an
isolated directory, then perform a separate migration and launch verification.

## SEO And Redirects

Before launch, inventory the deployed site's URLs and decide which are preserved, renamed or
removed. Update canonical URLs, `hreflang`, sitemap, robots, metadata and redirects together.
The legacy source location is not itself the redirect strategy; production URL behavior must be
verified separately.

## Open Questions

- What is the canonical production domain and preferred language at `/`?
- Which legal entity/contact details should appear on the legal and contact pages?
- Should complete examples be embedded in the main repository or a separate examples package?
- Should the new site use a small content generator, or remain hand-authored static HTML?
