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

## Forms

```js
import { createForm, fetchJson } from '../core/app.js';

const profile = createForm({ name: '', email: '' });
profile.set('email', 'ada@example.test');
await profile.submit((values) => fetchJson('/api/profile.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(values),
}));
```

Validation responses shaped as `{ errors: { field: 'message' } }` populate `form.state.errors`.

## Hash routing

```js
import { createHashRouter } from '../core/app.js';

const router = createHashRouter()
  .add('/', 'home')
  .add('/orders/:id', 'order');

router.subscribe((route) => {
  if (!route) return;
  console.log(route.target, route.params);
});
router.start();
```

Use ordinary links such as `<a href="#/orders/42">Order 42</a>`. Hash routing needs no server
configuration, which makes it suitable for static and shared-hosting deployments.

## Connection-owned resources

Use `listen()` and `onCleanup()` for timers, observers and external subscriptions. They are
released at disconnect time. `reconnected()` runs when a previously initialized component is
attached again; store subscriptions are restored automatically.
