# AI-first `.dv.js` authoring API

`component()` is an experimental v0.6 authoring layer for build-free DevinimJS components. It
creates a normal Custom Element on top of `BaseComponent`; it does not add a compiler, a runtime
dependency or a second renderer.

## Browser-first usage

```html
<acme-counter data-start="4" data-step="2"></acme-counter>
<script type="module" src="./acme-counter.dv.js"></script>
```

`.dv.js` is standard JavaScript. Static hosting and shared hosting need only serve it with the
normal JavaScript MIME type, which follows naturally from the `.js` suffix.

## Component contract

```js
import { component, html } from '/assets/devinim/authoring.min.js';

component('acme-counter', {
  props: { start: 0, step: 1 },

  state() {
    return { count: this.props.start };
  },

  sync: {
    start(value) {
      this.state.count = value;
    },
  },

  actions: {
    increment() {
      this.state.count += this.props.step;
      this.emit('change', { count: this.state.count });
    },
  },

  view() {
    return html`<button on:click="increment">${this.state.count}</button>`;
  },
});
```

## AI authoring rules

1. Start from the generator template.
2. Use only `props`, `state`, `sync`, `actions` and `view` unless the task requires the class API.
3. Define every external configuration field in `props`; do not read `dataset` directly.
4. Use `on:event="action"` for DOM actions and `this.emit('name', detail)` for external events.
5. Return `html`` from `view`; interpolated values are escaped by default.
6. Add a unit test and manifest entry before considering a component complete.

Run the delivery-contract check before review:

```bash
npm run validate:component -- acme-counter
```

It verifies that the source, unit test, component document and manifest entry agree on the tag.

## When to use the class API

Use `BaseComponent` when the component needs advanced lifecycle orchestration, special child
capture behaviour, custom store subscriptions or a deliberately low-level implementation. The
class API is fully supported; `.dv.js` is the concise default for new ordinary components.
