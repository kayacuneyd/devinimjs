# PHP Integration Guide

The contract in one sentence: **your backend prints the custom element with `data-*`
attributes; DevinimJS does the rest.** Works with native PHP, CodeIgniter, Laravel (Blade),
WordPress, SQLite-backed apps — anything that outputs HTML.

## 1. Install (choose one)

**Self-hosted (recommended for shared hosting):** upload `src/` (or the release `dist/`) to
e.g. `/assets/devinim/`, then:

```html
<script type="module" src="/assets/devinim/components/dv-counter.js"></script>
```

**CDN (pinned, never unpinned in production — ADR-0007):**

```html
<script type="module">
  import 'https://cdn.jsdelivr.net/gh/kayacuneyd/devinimjs@v0.1.0/dist/modules/dv-counter.js';
</script>
```

## 2. Pass scalar config

```php
<dv-counter data-start="<?= (int)$start ?>" data-step="<?= (int)$step ?>"></dv-counter>
```

Rules (ADR-0005):

- **Always escape attribute values:** `htmlspecialchars($value, ENT_QUOTES)`.
  Cast scalars when you know the type (`(int)`, `(float)`).
- `data-page-size="10"` arrives as `dataset.pageSize` — kebab-case becomes camelCase.
- Components read values via helpers: `this.num('start', 0)`, `this.str('title', '')`,
  `this.bool('open', false)`.

## 3. Pass arrays/objects (JSON in an attribute)

```php
<?php $users = [['name' => 'Ada'], ['name' => 'Grace']]; ?>
<dv-user-list data-users='<?= htmlspecialchars(json_encode($users), ENT_QUOTES) ?>'></dv-user-list>
```

Note the **single-quoted** attribute (JSON contains double quotes) and `ENT_QUOTES`.
The component parses with `this.json('users', [])`. Invalid JSON warns and falls back —
attributes carry **data, never markup** (ADR-0003).

## 4. React to component events

Components emit bubbling `CustomEvent`s namespaced `dv:*` (ADR-0004):

```js
document.querySelector('dv-counter').addEventListener('dv:change', (e) => {
  console.log(e.detail.count);
});
```

Because the events bubble, you can also delegate at `document` level for lists of components.

## 5. Framework recipes

**CodeIgniter 4 (view):**

```php
<dv-counter data-start="<?= esc($start) ?>"></dv-counter>
<script type="module" src="<?= base_url('assets/devinim/components/dv-counter.js') ?>"></script>
```

**Laravel (Blade):**

```blade
<dv-counter data-start="{{ $start }}"></dv-counter>
<script type="module" src="{{ asset('devinim/components/dv-counter.js') }}"></script>
```

**WordPress (6.5+ Script Modules API):**

```php
add_action('wp_enqueue_scripts', function () {
  wp_register_script_module('dv-counter', get_template_directory_uri() . '/devinim/components/dv-counter.js', [], '0.1.0');
  wp_enqueue_script_module('dv-counter');
});
```

(On older WordPress, print the `<script type="module">` tag in a template or use a small
`script_loader_tag` filter to add `type="module"`.)

## 6. Security checklist (ADR-0003, constitution §8)

- [ ] Every attribute value printed through `htmlspecialchars(..., ENT_QUOTES)` (or `esc()`).
- [ ] JSON in attributes via `htmlspecialchars(json_encode($v), ENT_QUOTES)`, single-quoted attr.
- [ ] User-controlled URLs only through `safeUrl()` on the JS side.
- [ ] CSP: `script-src 'self'` (plus the pinned CDN origin when used) — DevinimJS needs no
      `unsafe-eval` or `unsafe-inline` for its own operation.

## 7. What DevinimJS deliberately does not do

No server-side rendering and no no-JS fallback **inside components** (ADR-0001): interactive
widgets render when their module loads. Keep brochure/SEO-critical content in plain PHP + CKCSS
and use DevinimJS for the application-like parts. Per-widget `<noscript>` notes (see
`examples/counter.php`) are a good practice.
