// src/core/reactive.js
function isWrappable(value) {
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) return true;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
function createReactive(target, onChange) {
  const cache = /* @__PURE__ */ new WeakMap();
  function wrap(value, path) {
    if (!isWrappable(value)) return value;
    if (cache.has(value)) return cache.get(value);
    const proxy = new Proxy(value, {
      get(obj, key, receiver) {
        const child = Reflect.get(obj, key, receiver);
        return wrap(child, path === "" ? String(key) : `${path}.${String(key)}`);
      },
      set(obj, key, next, receiver) {
        const had = Object.prototype.hasOwnProperty.call(obj, key);
        const prev = obj[key];
        const ok = Reflect.set(obj, key, next, receiver);
        if (!had || prev !== next) {
          onChange(path === "" ? String(key) : `${path}.${String(key)}`);
        }
        return ok;
      },
      deleteProperty(obj, key) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          Reflect.deleteProperty(obj, key);
          onChange(path === "" ? String(key) : `${path}.${String(key)}`);
        }
        return true;
      }
    });
    cache.set(value, proxy);
    return proxy;
  }
  return wrap(target, "");
}

// src/core/html.js
var ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}
var HtmlString = class {
  /** @type {string} */
  #value;
  /**
   * @param {*} value - Trusted HTML source.
   */
  constructor(value) {
    this.#value = String(value);
  }
  /**
   * @returns {string} The raw, trusted HTML.
   */
  toString() {
    return this.#value;
  }
};
function renderValue(value) {
  if (value === null || value === void 0 || value === false) return "";
  if (value instanceof HtmlString) return value.toString();
  if (Array.isArray(value)) return value.map(renderValue).join("");
  return escapeHtml(value);
}
function html(strings, ...values) {
  const chunks = [...strings];
  let out = chunks[0];
  for (let i = 0; i < values.length; i++) {
    const next = chunks[i + 1];
    const value = values[i];
    const soleAttr = /([a-zA-Z_:][\w:.-]*)="$/.exec(out);
    if (soleAttr && next.startsWith('"') && (value === true || value === false || value === null || value === void 0)) {
      out = out.slice(0, out.length - soleAttr[0].length);
      const remainder = next.slice(1);
      if (value === true) {
        out += soleAttr[1] + remainder;
      } else {
        if (out.endsWith(" ")) out = out.slice(0, -1);
        out += remainder;
      }
      continue;
    }
    out += renderValue(value) + next;
  }
  return new HtmlString(out);
}
function unsafe(rawHtml) {
  return new HtmlString(rawHtml);
}

// src/core/morph.js
var OUTLET_TAG = "DV-OUTLET";
function morph(host, htmlString) {
  const tpl = document.createElement("template");
  tpl.innerHTML = htmlString;
  morphChildren(host, tpl.content);
}
function morphChildren(oldParent, newParent) {
  if (canMorphKeyedChildren(oldParent, newParent)) {
    morphKeyedChildren(oldParent, newParent);
    return;
  }
  const oldNodes = Array.from(oldParent.childNodes);
  const newNodes = Array.from(newParent.childNodes);
  const common = Math.min(oldNodes.length, newNodes.length);
  for (let i = 0; i < common; i++) morphNode(oldNodes[i], newNodes[i]);
  for (let i = common; i < newNodes.length; i++) oldParent.appendChild(newNodes[i]);
  for (let i = common; i < oldNodes.length; i++) oldNodes[i].remove();
}
function canMorphKeyedChildren(oldParent, newParent) {
  const oldElements = childElements(oldParent);
  const newElements = childElements(newParent);
  if (oldElements.length === 0 || newElements.length === 0) return false;
  if (!oldElements.every((el) => el.hasAttribute("data-key"))) return false;
  if (!newElements.every((el) => el.hasAttribute("data-key"))) return false;
  return hasUniqueKeys(oldElements, "existing") && hasUniqueKeys(newElements, "next");
}
function morphKeyedChildren(oldParent, newParent) {
  const oldByKey = new Map(childElements(oldParent).map((el) => [el.getAttribute("data-key"), el]));
  let reference = oldParent.firstChild;
  for (const newNode of Array.from(newParent.childNodes)) {
    let liveNode = newNode;
    if (newNode.nodeType === Node.ELEMENT_NODE && newNode.hasAttribute("data-key")) {
      const key = newNode.getAttribute("data-key");
      const existing = oldByKey.get(key);
      if (existing) {
        morphNode(existing, newNode);
        liveNode = existing;
        oldByKey.delete(key);
      }
    }
    if (liveNode !== reference) oldParent.insertBefore(liveNode, reference);
    reference = liveNode.nextSibling;
  }
  while (reference) {
    const next = reference.nextSibling;
    reference.remove();
    reference = next;
  }
}
function childElements(parent) {
  return Array.from(parent.childNodes).filter((node) => node.nodeType === Node.ELEMENT_NODE);
}
function hasUniqueKeys(elements, side) {
  const keys = /* @__PURE__ */ new Set();
  for (const el of elements) {
    const key = el.getAttribute("data-key");
    if (key === null || keys.has(key)) {
      console.warn(`[devinim] keyed morph skipped: duplicate or missing data-key in ${side} siblings.`);
      return false;
    }
    keys.add(key);
  }
  return true;
}
function morphNode(oldNode, newNode) {
  if (oldNode.nodeType !== newNode.nodeType || oldNode.nodeName !== newNode.nodeName) {
    oldNode.replaceWith(newNode);
    return;
  }
  if (oldNode.nodeType === Node.TEXT_NODE || oldNode.nodeType === Node.COMMENT_NODE) {
    if (oldNode.nodeValue !== newNode.nodeValue) oldNode.nodeValue = newNode.nodeValue;
    return;
  }
  if (oldNode.nodeName === OUTLET_TAG) return;
  syncFormControl(
    /** @type {Element} */
    oldNode,
    /** @type {Element} */
    newNode
  );
  syncAttributes(
    /** @type {Element} */
    oldNode,
    /** @type {Element} */
    newNode
  );
  morphChildren(oldNode, newNode);
}
function syncAttributes(oldEl, newEl) {
  for (const attr of Array.from(oldEl.attributes)) {
    if (!newEl.hasAttribute(attr.name)) oldEl.removeAttribute(attr.name);
  }
  for (const attr of Array.from(newEl.attributes)) {
    if (oldEl.getAttribute(attr.name) !== attr.value) oldEl.setAttribute(attr.name, attr.value);
  }
}
function syncFormControl(oldEl, newEl) {
  if (oldEl.nodeName === "INPUT") {
    const type = oldEl.getAttribute("type") ?? "text";
    if (type !== "checkbox" && type !== "radio" && oldEl.getAttribute("value") !== newEl.getAttribute("value")) {
      oldEl.value = newEl.getAttribute("value") ?? "";
    }
    if ((type === "checkbox" || type === "radio") && oldEl.hasAttribute("checked") !== newEl.hasAttribute("checked")) {
      oldEl.checked = newEl.hasAttribute("checked");
    }
    return;
  }
  if (oldEl.nodeName === "TEXTAREA" && oldEl.textContent !== newEl.textContent) {
    oldEl.value = newEl.textContent;
    return;
  }
  if (oldEl.nodeName === "OPTION" && oldEl.hasAttribute("selected") !== newEl.hasAttribute("selected")) {
    oldEl.selected = newEl.hasAttribute("selected");
  }
}

// src/core/base-component.js
var EVENT_ATTR_PATTERN = /(?:data-on|on):([\w:.-]+)=/g;
var OUTLET_TAG2 = "DV-OUTLET";
var BaseComponent = class extends HTMLElement {
  /** @type {boolean} True after the first connect initialized the component. */
  #initialized = false;
  /** @type {object | null} The reactive state proxy. */
  #state = null;
  /** @type {DocumentFragment | null} Captured initial children awaiting an outlet. */
  #childrenFragment = null;
  /** @type {boolean} Whether a render is already queued for this microtask. */
  #updateQueued = false;
  /** @type {Set<string>} Root state keys changed since the last render. */
  #changedKeys = /* @__PURE__ */ new Set();
  /** @type {Set<string>} Event types already delegated on this element. */
  #delegatedTypes = /* @__PURE__ */ new Set();
  /** @type {Map<object, { unsubscribe: (() => void) | null, filter: ((path: string) => boolean) | null }>} */
  #storeSubscriptions = /* @__PURE__ */ new Map();
  /** @type {Set<() => void>} Cleanup work owned by the current DOM connection. */
  #cleanupFns = /* @__PURE__ */ new Set();
  /**
   * Per the Custom Elements spec: do NOT touch attributes or the DOM here.
   * All initialization happens at connect time.
   */
  constructor() {
    super();
  }
  /**
   * Runs once between child capture and `initialState()`. Components whose configuration
   * lives in their light-DOM children (e.g. `<dv-tabs>` reading `data-tab` labels) inspect
   * the captured fragment here (ADR-0009 amendment). Default: no-op.
   *
   * @param {DocumentFragment | null} fragment - Captured initial children (null when none).
   * @returns {void}
   */
  prepare(fragment) {
  }
  // eslint-disable-line no-unused-vars
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
  connected() {
  }
  /** Called on every re-attachment after the first initialization. */
  reconnected() {
  }
  /** Called when the element leaves the document. Override for cleanup. */
  disconnected() {
  }
  /**
   * Called after each state-driven re-render (not after the first render — use `connected`).
   *
   * @param {string[]} changedKeys - Deduplicated root state keys that changed in this batch.
   * @returns {void}
   */
  updated(changedKeys) {
  }
  // eslint-disable-line no-unused-vars
  /**
   * Called when an observed attribute changes after initialization. Declare
   * `static observedAttributes = ['data-…']` and sync state here explicitly (ADR-0005).
   *
   * @param {string} name - Attribute name (e.g. `'data-start'`).
   * @param {string | null} newValue - New value (`null` when removed).
   * @param {string | null} oldValue - Previous value.
   * @returns {void}
   */
  onAttribute(name, newValue, oldValue) {
  }
  // eslint-disable-line no-unused-vars
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
    if (this.#initialized) {
      this.#resubscribeStores();
      this.reconnected();
      return;
    }
    this.#initialized = true;
    this.#childrenFragment = captureChildren(this);
    this.prepare(this.#childrenFragment);
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
    this.#unsubscribeStores();
    this.#runCleanup();
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
    this.#changedKeys.add(path.split(".")[0]);
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
        `[devinim] ${this.nodeName.toLowerCase()}: template() must return an HtmlString produced by the html tag (ADR-0002).`
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
    const outlet = this.querySelector("dv-outlet");
    if (!outlet) {
      console.warn(
        `[devinim] ${this.nodeName.toLowerCase()}: initial children were dropped because template() does not include \${this.outlet} (ADR-0009).`
      );
      this.#childrenFragment = null;
      return;
    }
    outlet.style.display = "contents";
    outlet.append(this.#childrenFragment);
    this.#childrenFragment = null;
    for (const node of outlet.querySelectorAll("*")) {
      for (const attr of node.attributes) {
        if (attr.name.startsWith("data-on:")) this.#addDelegation(attr.name.slice(8));
        if (attr.name.startsWith("on:")) this.#addDelegation(attr.name.slice(3));
      }
    }
  }
  /**
   * Scans rendered output for `data-on:type` or `on:type` directives and delegates their event types
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
    const legacyAttr = `data-on:${type}`;
    const conciseAttr = `on:${type}`;
    let el = event.target instanceof Element ? event.target : event.target?.parentElement;
    while (el && el !== this && !el.hasAttribute(legacyAttr) && !el.hasAttribute(conciseAttr)) {
      el = el.parentElement;
    }
    if (!el || el === this || !this.#owns(el)) return;
    const method = el.getAttribute(conciseAttr) ?? el.getAttribute(legacyAttr);
    if (!method) return;
    if (typeof this[method] !== "function") {
      console.warn(
        `[devinim] ${this.nodeName.toLowerCase()}: no method "${method}" for on:${type} (ADR-0004).`
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
      if (node.nodeType === 1 && node.tagName.includes("-") && node.tagName !== OUTLET_TAG2) {
        return false;
      }
      node = node.parentNode;
    }
    return false;
  }
  /**
   * Schedules a re-render without a state change (ADR-0011 #4). The batch reaches `updated()`
   * with `['<external>']`. Escape hatch for external data sources — stores, timers, sockets.
   *
   * @returns {void}
   */
  requestUpdate() {
    if (this.#updateQueued) return;
    this.#notify("<external>");
  }
  /**
   * Subscribes this component to a shared store (ADR-0011). An optional path filter prevents
   * unrelated store changes from scheduling a render; subscriptions resume on re-attachment.
   *
   * @param {{ subscribe: (fn: (path: string) => void) => () => void }} store - A store from
   *   `createStore()`.
   * @param {string | string[] | ((path: string) => boolean)} [paths] - Interested state paths,
   *   or a predicate receiving each changed path.
   * @returns {() => void} Stops this subscription permanently.
   *
   * @example
   * connected() { this.useStore(cartStore, ['cart.items']); }
   */
  useStore(store, paths) {
    const existing = this.#storeSubscriptions.get(store);
    if (existing) return () => this.#removeStore(store);
    const subscription = { unsubscribe: null, filter: createPathFilter(paths) };
    this.#storeSubscriptions.set(store, subscription);
    this.#subscribeStore(store, subscription);
    return () => this.#removeStore(store);
  }
  /**
   * Registers cleanup work for this connection. It runs automatically when the component leaves
   * the document and is useful for timers, observers and third-party subscriptions.
   *
   * @param {() => void} cleanup - Function to run at disconnect time.
   * @returns {() => void} Removes the cleanup without running it.
   */
  onCleanup(cleanup) {
    this.#cleanupFns.add(cleanup);
    return () => this.#cleanupFns.delete(cleanup);
  }
  /**
   * Adds an event listener that is removed automatically on disconnect.
   *
   * @param {EventTarget} target - Event target to observe.
   * @param {string} type - Event type.
   * @param {EventListenerOrEventListenerObject} listener - Listener to register.
   * @param {boolean | AddEventListenerOptions} [options] - Native listener options.
   * @returns {() => void} Removes the listener early.
   */
  listen(target, type, listener, options) {
    target.addEventListener(type, listener, options);
    return this.onCleanup(() => target.removeEventListener(type, listener, options));
  }
  /** @param {object} store - Store to remove from this component. */
  #removeStore(store) {
    const subscription = this.#storeSubscriptions.get(store);
    if (!subscription) return;
    subscription.unsubscribe?.();
    this.#storeSubscriptions.delete(store);
  }
  /**
   * @param {{ subscribe: (fn: (path: string) => void) => () => void }} store - Store to subscribe.
   * @param {{ unsubscribe: (() => void) | null, filter: ((path: string) => boolean) | null }} subscription - Subscription metadata.
   */
  #subscribeStore(store, subscription) {
    if (subscription.unsubscribe) return;
    subscription.unsubscribe = store.subscribe((path) => {
      if (!subscription.filter || subscription.filter(path)) this.requestUpdate();
    });
  }
  /** Restores store subscriptions after a disconnect/reconnect cycle. */
  #resubscribeStores() {
    for (const [store, subscription] of this.#storeSubscriptions) this.#subscribeStore(store, subscription);
  }
  /** Removes active store listeners while retaining their reconnection metadata. */
  #unsubscribeStores() {
    for (const subscription of this.#storeSubscriptions.values()) {
      subscription.unsubscribe?.();
      subscription.unsubscribe = null;
    }
  }
  /** Runs and clears connection-owned cleanup functions. */
  #runCleanup() {
    for (const cleanup of this.#cleanupFns) cleanup();
    this.#cleanupFns.clear();
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
  str(key, fallback = "") {
    const value = this.dataset[key];
    return value === void 0 ? fallback : value;
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
    if (value === void 0) return fallback;
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
    if (value === void 0) return fallback;
    return value !== "false" && value !== "0";
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
    if (value === void 0) return fallback;
    try {
      return JSON.parse(value);
    } catch {
      console.warn(`[devinim] ${this.nodeName.toLowerCase()}: invalid JSON in data-${key}.`);
      return fallback;
    }
  }
};
function captureChildren(el) {
  if (!el.firstChild) return null;
  const fragment = document.createDocumentFragment();
  while (el.firstChild) fragment.appendChild(el.firstChild);
  return fragment;
}
function createPathFilter(paths) {
  if (paths === void 0) return null;
  if (typeof paths === "function") return paths;
  const watched = (Array.isArray(paths) ? paths : [paths]).filter(Boolean);
  return (changed) => watched.some((path) => changed === path || changed.startsWith(`${path}.`) || path.startsWith(`${changed}.`));
}

// src/core/store.js
function createStore(initialState = {}) {
  const listeners = /* @__PURE__ */ new Set();
  const state = createReactive(initialState, (path) => {
    for (const fn of [...listeners]) fn(path);
  });
  return {
    state,
    /**
     * Registers a change listener.
     *
     * @param {(path: string) => void} fn - Called with the changed dot path after any mutation.
     * @returns {() => void} Unsubscribe function.
     */
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    }
  };
}

// src/core/registry.js
function define(tagName, ctor) {
  if (typeof tagName !== "string" || !tagName.includes("-")) {
    throw new Error(
      `[devinim] Invalid custom element name "${tagName}" \u2014 it must contain a hyphen (ADR-0006).`
    );
  }
  const existing = customElements.get(tagName);
  if (existing) {
    console.warn(`[devinim] "${tagName}" is already defined; skipping re-registration.`);
    return existing;
  }
  customElements.define(tagName, ctor);
  return ctor;
}

// src/core/utils.js
var DEFAULT_ALLOWED = ["http:", "https:", "mailto:", "tel:"];
function safeUrl(value, { allow = DEFAULT_ALLOWED } = {}) {
  const raw = String(value ?? "").trim();
  if (raw === "") return "#";
  if (raw.startsWith("/") || raw.startsWith("#") || raw.startsWith("./") || raw.startsWith("../")) {
    return raw;
  }
  try {
    const url = new URL(raw, "https://devinim.invalid");
    return allow.includes(url.protocol) ? raw : "#";
  } catch {
    return "#";
  }
}
export {
  BaseComponent,
  HtmlString,
  createReactive,
  createStore,
  define,
  escapeHtml,
  html,
  morph,
  safeUrl,
  unsafe
};
