# Application Runtime Guide

DevinimJS can power static HTML, PHP, WordPress or any JSON API. These optional helpers remain
plain browser ES modules: no bundler and no server rewrite are required.

For a self-hosted optimized build, import the optional `dist/app.min.js` module alongside
`dist/core.min.js`; small widget pages can omit it entirely.

## Async API data

```js
import { BaseComponent, html } from '../core/core.js';
import { createAsyncState, fetchJson } from '../core/app.js';

const users = createAsyncState();

class AcmeUsers extends BaseComponent {
  connected() {
    this.useStore(users);
    users.run(() => fetchJson('/api/users.php'));
  }

  template() {
    if (users.state.status === 'loading') return html`<p>Loading…</p>`;
    if (users.state.status === 'error') return html`<p role="alert">Could not load users.</p>`;
    return html`<ul>${users.state.data.map((user) => html`<li data-key="${user.id}">${user.name}</li>`)}</ul>`;
  }
}
```

`createAsyncState()` protects the UI from stale responses: if a newer request starts first, a
late older response cannot replace its data.

## API client (`createApi`, ADR-0021)

One client per application, created at bootstrap. It sends the CI4 CSRF token (from
`<meta name="csrf-token">`) on every state-changing request, rides the session cookie and
funnels 401s and failures into hooks:

```js
import { createApi } from '../core/app.js';

const api = createApi({
  baseUrl: '/api/v1',
  onError: (err) => console.warn(err.message),
  onUnauthorized: () => router.navigate('/login'),
});

const posts = await api.get('/posts', { page: 1, q: 'ada' });   // query params, nulls skipped
await api.post('/posts', { title: 'Merhaba' });                 // JSON body + CSRF header
await api.put(`/posts/${id}`, values);
await api.delete(`/posts/${id}`);
await api.upload('/media/upload', formData, { onProgress: (ratio) => {} }); // XHR progress
```

Failures reject with `HttpError`: `error.status` plus the parsed JSON `error.body` — CI4's
`failValidationErrors()` arrives as `error.body.errors`, the exact shape `createForm` consumes.

## Forms

```js
import { createForm, validate } from '../core/app.js';

const profile = createForm({ name: '', email: '' });
profile.set('email', 'ada@example.test');

// Client-side rules (ADR-0022) mirror the CI4 rule vocabulary:
if (profile.validate({ name: 'required|minLength:2', email: 'required|email' })) {
  await profile.submit((values) => api.post('/profile', values));
}
// form.state.errors.email renders either side's message — one template branch covers both.
```

`validate(values, rules, messages?)` is also standalone. Rules: `required`, `email`, `url`,
`number`, `min:n`, `max:n`, `minLength:n`, `maxLength:n`, `pattern:…`, `match:field`. Message
overrides resolve `'<field>.<rule>'` → `'<rule>'` → the English default:

```js
validate(data, { email: 'required|email' }, { 'email.required': 'E-posta zorunludur.' });
```

## Hash routing

```js
import { createHashRouter, bindRouterLinks } from '../core/app.js';

const router = createHashRouter()
  .add('/', 'acme-dashboard')                       // element tag target
  .add('/orders/:id', 'acme-order')                 // params → data-param-id
  .add('/admin/*', 'acme-admin')                    // trailing wildcard → params.wildcard
  .add('/reports', () => import('./acme-reports.js').then(() => 'acme-reports')); // lazy

router.beforeEach((route) => (session.user ? true : '/login')); // guard: false blocks, string redirects
router.mount('#app');   // renders the matched element into #app
router.start();
bindRouterLinks(router); // <a dv-link="/orders/42"> navigates without reload
```

Guards (`beforeEach`, per-route `beforeEnter`) may be async. `mount()` updates `data-param-*`
attributes in place when only the params change, and swaps elements when the tag changes.
Plain `<a href="#/orders/42">` links keep working too — hash routing needs no server
configuration, which makes it suitable for static and shared-hosting deployments.

## Shared stores: persistence (ADR-0011 amendment)

```js
const cart = createStore({ items: [] });
cart.persist('my-shop-cart');     // hydrates from localStorage, then writes through on change
cart.set('coupon', 'WELCOME');    // top-level key helper (prototype-pollution guarded)
cart.update((state) => ({ items: [...state.items, product] })); // or mutate state directly
```

## Application i18n (`createI18n`, ADR-0024)

```js
import { createI18n } from '../core/app.js';

const i18n = createI18n({
  fallbackLocale: 'en',
  messages: {
    tr: { save: 'Kaydet', post_count: '{count} yazı' },
    en: { save: 'Save', post_count: '{count} post|{count} posts' },
  },
});

i18n.t('save');                          // "Kaydet" (when the active locale is tr)
i18n.t('post_count', { count: 5 });      // "5 posts" — one|other pipes select on count
i18n.setLocale('en');                    // notifies onLocaleChange subscribers → re-render
```

## Debug hook (ADR-0026, dev only)

```js
import { installDebug } from '../core/debug.js'; // never shipped to production bundles
if (location.hostname === 'localhost') installDebug();
// console: __DEVINIM_DEBUG__.tags() / .components() / .stores()
```

## Connection-owned resources

Use `listen()` and `onCleanup()` for timers, observers and external subscriptions. They are
released at disconnect time. `reconnected()` runs when a previously initialized component is
attached again; store subscriptions are restored automatically.
