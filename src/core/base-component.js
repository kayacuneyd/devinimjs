/**
 * @module core/base-component
 * BaseComponent — the single base class every DevinimJS component extends (ADR-0001).
 *
 * Pipeline: connect → capture light-DOM children (ADR-0009) → build reactive state from
 * `initialState()` → render `template()` → morph into place → delegate events (ADR-0004).
 * State mutations are batched: one render per microtask, then `updated(changedKeys)`.
 */

import { createReactive } from './reactive.js';
import { html, HtmlString } from './html.js';
import { morph } from './morph.js';

/** Matches event directives in rendered templates, e.g. data-on:click / data-on:dv:save. */
const EVENT_ATTR_PATTERN = /data-on:([\w:.-]+)=/g;

/** Outlet tag is a transparent framework wrapper — exempt from the ownership boundary. */
const OUTLET_TAG = 'DV-OUTLET';

/**
 * Base class for all DevinimJS components. Light DOM only — never call attachShadow.
 */
export class BaseComponent extends HTMLElement {
  /** @type {boolean} True after the first connect initialized the component. */
  #initialized = false;
  /** @type {object | null} The reactive state proxy. */
  #state = null;
  /** @type {DocumentFragment | null} Captured initial children awaiting an outlet. */
  #childrenFragment = null;
  /** @type {boolean} Whether a render is already queued for this microtask. */
  #updateQueued = false;
  /** @type {Set<string>} Root state keys changed since the last render. */
  #changedKeys = new Set();
  /** @type {Set<string>} Event types already delegated on this element. */
  #delegatedTypes = new Set();

  /**
   * Per the Custom Elements spec: do NOT touch attributes or the DOM here.
   * All initialization happens at connect time.
   */
  constructor() {
    super();
  }

  /**
   * Returns the initial state object. Runs once at connect time; `this.dataset` and the
   * `str/num/bool/json` helpers are safe to use here.
   *
   * @returns {object} Initial state (default: empty object).
   */
  initialState() {
    return {};
  }

  /**
   * Returns the component's template. Must return an {@link HtmlString} produced by `html`.
   *
   * @returns {HtmlString} Template output.
   */
  template() {
    return html``;
  }

  /** Called once, after the first render. Override for setup (timers, external listeners). */
  connected() {}

  /** Called when the element leaves the document. Override for cleanup. */
  disconnected() {}

  /**
   * Called after each state-driven re-render (not after the first render — use `connected`).
   *
   * @param {string[]} changedKeys - Deduplicated root state keys that changed in this batch.
   * @returns {void}
   */
  updated(changedKeys) {} // eslint-disable-line no-unused-vars

  /**
   * Called when an observed attribute changes after initialization. Declare
   * `static observedAttributes = ['data-…']` and sync state here explicitly (ADR-0005).
   *
   * @param {string} name - Attribute name (e.g. `'data-start'`).
   * @param {string | null} newValue - New value (`null` when removed).
   * @param {string | null} oldValue - Previous value.
   * @returns {void}
   */
  onAttribute(name, newValue, oldValue) {} // eslint-disable-line no-unused-vars

  /**
   * The reactive state proxy. Mutate it directly — rendering follows automatically.
   *
   * @type {object}
   */
  get state() {
    return this.#state;
  }

  /**
   * Standard callback — do not override; use `connected()` instead. Initializes state,
   * performs the first render, captures outlet children.
   *
   * @returns {void}
   */
  connectedCallback() {
    if (this.#initialized) return; // re-attaches must not re-initialize
    this.#initialized = true;

    this.#childrenFragment = captureChildren(this);
    this.#state = createReactive(this.initialState() ?? {}, (path) => this.#notify(path));
    this.#render();
    this.connected();
  }

  /**
   * Standard callback — do not override; use `disconnected()` instead.
   *
   * @returns {void}
   */
  disconnectedCallback() {
    this.disconnected();
  }

  /**
   * Standard callback — do not override; use `onAttribute()` instead. Changes arriving
   * before connect are ignored: `initialState()` reads current values anyway (ADR-0005 #4).
   *
   * @param {string} name - Attribute name.
   * @param {string | null} oldValue - Previous value.
   * @param {string | null} newValue - New value.
   * @returns {void}
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.#initialized || oldValue === newValue) return;
    this.onAttribute(name, newValue, oldValue);
  }

  /**
   * Schedules a batched re-render: one render per microtask regardless of how many
   * mutations happened synchronously (ADR-0004 #8).
   *
   * @param {string} path - Dot-separated changed path reported by the reactive proxy.
   * @returns {void}
   */
  #notify(path) {
    this.#changedKeys.add(path.split('.')[0]);
    if (this.#updateQueued) return;
    this.#updateQueued = true;
    queueMicrotask(() => {
      this.#updateQueued = false;
      const keys = [...this.#changedKeys];
      this.#changedKeys.clear();
      if (!this.isConnected) return;
      this.#render();
      this.updated(keys);
    });
  }

  /**
   * Renders the template and morphs it into this element, then refreshes outlet content
   * and event delegation.
   *
   * @returns {void}
   */
  #render() {
    const output = this.template();
    if (!(output instanceof HtmlString)) {
      throw new TypeError(
        `[devinim] ${this.nodeName.toLowerCase()}: template() must return an HtmlString produced by the html tag (ADR-0002).`,
      );
    }
    const htmlString = output.toString();
    morph(this, htmlString);
    this.#placeOutletChildren();
    this.#refreshDelegation(htmlString);
  }

  /**
   * Moves the captured initial children into the first `<dv-outlet>` (once). Warns when a
   * template drops children by omitting `${this.outlet}` (ADR-0009 #7).
   *
   * @returns {void}
   */
  #placeOutletChildren() {
    if (!this.#childrenFragment) return;
    const outlet = this.querySelector('dv-outlet');
    if (!outlet) {
      console.warn(
        `[devinim] ${this.nodeName.toLowerCase()}: initial children were dropped because template() does not include \${this.outlet} (ADR-0009).`,
      );
      this.#childrenFragment = null;
      return;
    }
    outlet.style.display = 'contents'; // structural transparency, not design (ADR-0009 #3)
    outlet.append(this.#childrenFragment);
    this.#childrenFragment = null;
    // Outlet content carries no template string, so its data-on types are discovered from
    // the DOM instead (ADR-0004 #3): one scan, at placement time.
    for (const node of outlet.querySelectorAll('*')) {
      for (const attr of node.attributes) {
        if (attr.name.startsWith('data-on:')) this.#addDelegation(attr.name.slice(8));
      }
    }
  }

  /**
   * Scans rendered output for `data-on:type` directives and delegates their event types
   * (ADR-0004 #2/#3).
   *
   * @param {string} htmlString - The rendered template string.
   * @returns {void}
   */
  #refreshDelegation(htmlString) {
    for (const match of htmlString.matchAll(EVENT_ATTR_PATTERN)) {
      this.#addDelegation(match[1]);
    }
  }

  /**
   * Attaches one delegated listener for an event type on this element (idempotent).
   *
   * @param {string} type - Event type, e.g. `'click'` or `'dv:save'`.
   * @returns {void}
   */
  #addDelegation(type) {
    if (this.#delegatedTypes.has(type)) return;
    this.#delegatedTypes.add(type);
    this.addEventListener(type, (event) => this.#dispatch(event, type));
  }

  /**
   * Resolves a delegated event to the component method named by the directive.
   *
   * @param {Event} event - The DOM event.
   * @param {string} type - The event type being dispatched.
   * @returns {void}
   */
  #dispatch(event, type) {
    const selector = `[data-on:${type.replace(/:/g, '\\:')}]`;
    const start = event.target instanceof Element ? event.target : event.target?.parentElement;
    const el = start?.closest(selector);
    if (!el || !this.#owns(el)) return;

    const method = el.getAttribute(`data-on:${type}`);
    if (!method) return;
    if (typeof this[method] !== 'function') {
      console.warn(
        `[devinim] ${this.nodeName.toLowerCase()}: no method "${method}" for data-on:${type} (ADR-0004).`,
      );
      return;
    }
    this[method](event, el);
  }

  /**
   * Ownership rule (ADR-0004 #5): the directive element belongs to this component when, walking
   * up from it, `this` is reached before any other custom element. `<dv-outlet>` is transparent
   * and does not count as a boundary.
   *
   * @param {Element} directiveEl - Element carrying the data-on directive.
   * @returns {boolean} True when this component owns the directive.
   */
  #owns(directiveEl) {
    let node = directiveEl.parentNode;
    while (node) {
      if (node === this) return true;
      if (node.nodeType === 1 && node.tagName.includes('-') && node.tagName !== OUTLET_TAG) {
        return false;
      }
      node = node.parentNode;
    }
    return false;
  }

  /**
   * Emits a bubbling, composed `CustomEvent` namespaced as `dv:name` (ADR-0004 #7).
   *
   * @param {string} name - Event name without the namespace (e.g. `'change'` → `dv:change`).
   * @param {*} [detail] - Payload available as `event.detail`.
   * @returns {void}
   *
   * @example
   * this.emit('save', { id: 7 }); // consumers: el.addEventListener('dv:save', …)
   */
  emit(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(`dv:${name}`, { detail, bubbles: true, composed: true }));
  }

  /**
   * Outlet marker for initial light-DOM children. Place `${this.outlet}` in `template()`
   * where the captured children should live (ADR-0009).
   *
   * @type {HtmlString}
   */
  get outlet() {
    return html`<dv-outlet></dv-outlet>`;
  }

  /**
   * Reads a `data-*` value as string. `data-page-title` → key `'pageTitle'`.
   *
   * @param {string} key - camelCase dataset key.
   * @param {string} [fallback] - Value when the attribute is absent.
   * @returns {string} The attribute value or fallback.
   */
  str(key, fallback = '') {
    const value = this.dataset[key];
    return value === undefined ? fallback : value;
  }

  /**
   * Reads a `data-*` value as a finite number.
   *
   * @param {string} key - camelCase dataset key.
   * @param {number} [fallback] - Value when absent or not a finite number.
   * @returns {number} The coerced number or fallback.
   */
  num(key, fallback = 0) {
    const value = this.dataset[key];
    if (value === undefined) return fallback;
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  /**
   * Reads a `data-*` value as boolean. `'false'` and `'0'` are false; any other present
   * value (including empty) is true.
   *
   * @param {string} key - camelCase dataset key.
   * @param {boolean} [fallback] - Value when the attribute is absent.
   * @returns {boolean} The coerced boolean or fallback.
   */
  bool(key, fallback = false) {
    const value = this.dataset[key];
    if (value === undefined) return fallback;
    return value !== 'false' && value !== '0';
  }

  /**
   * Reads a `data-*` value as parsed JSON. Warns and falls back on invalid JSON. Never
   * returns HtmlString — attributes carry data, never markup (ADR-0003 #4).
   *
   * @param {string} key - camelCase dataset key.
   * @param {*} [fallback] - Value when absent or unparseable.
   * @returns {*} The parsed value or fallback.
   */
  json(key, fallback = null) {
    const value = this.dataset[key];
    if (value === undefined) return fallback;
    try {
      return JSON.parse(value);
    } catch {
      console.warn(`[devinim] ${this.nodeName.toLowerCase()}: invalid JSON in data-${key}.`);
      return fallback;
    }
  }
}

/**
 * Moves the element's current children into a fresh DocumentFragment (ADR-0009 #1).
 *
 * @param {Element} el - The component element before its first render.
 * @returns {DocumentFragment | null} The captured children, or null when there were none.
 */
function captureChildren(el) {
  if (!el.firstChild) return null;
  const fragment = document.createDocumentFragment();
  while (el.firstChild) fragment.appendChild(el.firstChild);
  return fragment;
}
