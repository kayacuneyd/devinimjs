/**
 * @module core/component
 * AI-first, build-free component factory. It is an ergonomic layer over BaseComponent,
 * not a second renderer or lifecycle: all existing security, morphing and cleanup rules apply.
 */

import { BaseComponent } from './base-component.js';
import { define } from './registry.js';

const RESERVED_ACTIONS = new Set([
  ...Object.getOwnPropertyNames(BaseComponent.prototype),
  'constructor', 'props', 'initialState', 'template', 'onAttribute',
]);

/**
 * Defines and registers a build-free component from a compact object contract.
 *
 * @param {string} tagName - A hyphenated custom-element tag.
 * @param {{
 *   props?: Record<string, string | number | boolean | Array<unknown> | object | { type?: StringConstructor | NumberConstructor | BooleanConstructor | ArrayConstructor | ObjectConstructor, default?: *, required?: boolean }>,
 *   state?: object | (() => object),
 *   sync?: Record<string, (value: unknown, previous: unknown) => void>,
 *   actions?: Record<string, (event?: Event, element?: Element) => void>,
 *   view: () => import('./html.js').HtmlString,
 *   connected?: () => void,
 *   reconnected?: () => void,
 *   disconnected?: () => void,
 *   updated?: (changedKeys: string[]) => void,
 *   onError?: (error: unknown, phase: 'render' | 'action') => void,
 * }} config - Factory component contract.
 * @returns {CustomElementConstructor} The registered custom-element constructor.
 */
export function component(tagName, config) {
  validateConfig(tagName, config);
  const propDefinitions = Object.entries(config.props ?? {}).map(([key, raw]) => normalizeProp(key, raw));
  const propByAttribute = new Map(propDefinitions.map((definition) => [definition.attribute, definition]));

  class FactoryComponent extends BaseComponent {
    static observedAttributes = propDefinitions.map((definition) => definition.attribute);

    #props = {};

    /** @returns {Readonly<Record<string, unknown>>} Typed, live-synchronised data-* props. */
    get props() {
      return Object.freeze({ ...this.#props });
    }

    /** @returns {object} Initial state from the factory contract. */
    initialState() {
      this.#props = Object.fromEntries(propDefinitions.map((definition) => [
        definition.key,
        readProp(this, definition),
      ]));
      for (const definition of propDefinitions) checkProp(this, definition);
      if (typeof config.state === 'function') return config.state.call(this) ?? {};
      return cloneDefault(config.state ?? {});
    }

    /** @returns {import('./html.js').HtmlString} Factory view output. */
    template() {
      return config.view.call(this);
    }

    /**
     * Synchronises a declared data-* prop after the browser changes it.
     *
     * @param {string} name - Changed attribute name.
     * @param {string | null} value - New raw attribute value.
     * @param {string | null} oldValue - Previous raw attribute value.
     * @returns {void}
     */
    onAttribute(name, value, oldValue) {
      const definition = propByAttribute.get(name);
      if (!definition) return;
      checkProp(this, definition);
      const previous = this.#props[definition.key];
      const next = readProp(this, definition);
      if (Object.is(previous, next)) return;
      this.#props[definition.key] = next;
      config.sync?.[definition.key]?.call(this, next, previous, value, oldValue);
      this.requestUpdate();
    }

    /** @returns {void} */
    connected() { config.connected?.call(this); }
    /** @returns {void} */
    reconnected() { config.reconnected?.call(this); }
    /** @returns {void} */
    disconnected() { config.disconnected?.call(this); }
    /** @param {string[]} changedKeys - Reactive state paths changed in the render. @returns {void} */
    updated(changedKeys) { config.updated?.call(this, changedKeys); }
  }

  for (const [name, action] of Object.entries(config.actions ?? {})) {
    FactoryComponent.prototype[name] = action;
  }

  // Only assigned when provided (ADR-0015): a factory component with no config.onError must
  // still inherit BaseComponent.prototype.onError's rethrow default, not silently swallow errors.
  if (config.onError) {
    FactoryComponent.prototype.onError = function onError(error, phase) {
      config.onError.call(this, error, phase);
    };
  }

  return define(tagName, FactoryComponent);
}

/**
 * Validates the small public factory contract before a custom element is registered.
 *
 * @param {string} tagName - Proposed custom-element name.
 * @param {object} config - Factory configuration.
 * @returns {void}
 */
function validateConfig(tagName, config) {
  if (typeof tagName !== 'string' || !tagName.includes('-')) {
    throw new TypeError('[devinim] component(tag, config): tag must be a hyphenated custom-element name.');
  }
  if (!config || typeof config !== 'object' || typeof config.view !== 'function') {
    throw new TypeError('[devinim] component(tag, config): config.view must be a function returning html``.');
  }
  if (config.props !== undefined && !isPlainObject(config.props)) {
    throw new TypeError('[devinim] component(tag, config): props must be a plain object.');
  }
  for (const [name, raw] of Object.entries(config.props ?? {})) {
    if (!/^[A-Za-z_$][\w$]*$/.test(name)) {
      throw new TypeError(`[devinim] component(tag, config): prop "${name}" must be a JavaScript identifier.`);
    }
    if (isDescriptor(raw)) {
      validateDescriptor(name, raw);
      continue;
    }
    if (!isPropDefault(raw)) {
      throw new TypeError(
        `[devinim] component(tag, config): prop "${name}" must default to a string, number, boolean, array or plain object — or a { type, default, required } descriptor.`,
      );
    }
  }
  for (const [name, action] of Object.entries(config.actions ?? {})) {
    if (!/^[A-Za-z_$][\w$]*$/.test(name) || RESERVED_ACTIONS.has(name) || typeof action !== 'function') {
      throw new TypeError(`[devinim] component(tag, config): invalid action "${name}".`);
    }
  }
  for (const [name, sync] of Object.entries(config.sync ?? {})) {
    if (!Object.hasOwn(config.props ?? {}, name) || typeof sync !== 'function') {
      throw new TypeError(`[devinim] component(tag, config): sync "${name}" must match a prop and be a function.`);
    }
  }
  for (const hook of ['connected', 'reconnected', 'disconnected', 'updated', 'onError']) {
    if (config[hook] !== undefined && typeof config[hook] !== 'function') {
      throw new TypeError(`[devinim] component(tag, config): ${hook} must be a function.`);
    }
  }
}

/**
 * Reads a data-* prop through BaseComponent's existing typed attribute helpers. The coercion
 * target is the descriptor's declared `type` when present, else the type of the bare default
 * (legacy inference — unchanged behavior for shorthand props).
 *
 * @param {BaseComponent} host - Component instance owning the attribute.
 * @param {{ key: string, fallback: unknown, type: Function | null }} definition - Prop metadata.
 * @returns {unknown} Parsed prop value.
 */
function readProp(host, definition) {
  const { key, fallback, type } = definition;
  const effective = type ?? (
    typeof fallback === 'number' ? Number
      : typeof fallback === 'boolean' ? Boolean
        : Array.isArray(fallback) ? Array
          : isPlainObject(fallback) ? Object
            : String
  );
  if (effective === Number) return host.num(key, typeof fallback === 'number' ? fallback : 0);
  if (effective === Boolean) return host.bool(key, fallback === true);
  if (effective === Array || effective === Object) return host.json(key, cloneDefault(fallback));
  return host.str(key, String(fallback ?? ''));
}

/**
 * Converts a JavaScript prop name into its data-* attribute suffix.
 *
 * @param {string} value - Camel-case prop name.
 * @returns {string} Kebab-case suffix.
 */
function toKebabCase(value) {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * Identifies JSON-compatible object defaults.
 *
 * @param {unknown} value - Candidate value.
 * @returns {boolean} Whether the value is a plain object.
 */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
}

/**
 * Keeps prop parsing deterministic and JSON-compatible across ordinary shared hosting.
 *
 * @param {unknown} value - Candidate default value.
 * @returns {boolean} Whether the value can be used as a prop default.
 */
function isPropDefault(value) {
  return typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
    || Array.isArray(value)
    || isPlainObject(value);
}

/**
 * Gives each component instance its own mutable structured default.
 *
 * @param {unknown} value - Default value to copy.
 * @returns {unknown} Independent value.
 */
function cloneDefault(value) {
  if (Array.isArray(value) || isPlainObject(value)) return JSON.parse(JSON.stringify(value));
  return value;
}

/** Allowed descriptor `type` constructors. */
const PROP_TYPES = new Set([String, Number, Boolean, Array, Object]);

/** Keys that mark a props entry as a `{ type, default, required }` descriptor (ADR-0025). */
const DESCRIPTOR_KEYS = new Set(['type', 'default', 'required']);

/**
 * A props entry is a descriptor when it is a plain object whose keys are all descriptor keys
 * (`{ start: { type: Number, default: 0, required: true } }`). A JSON default that happens to
 * use one of these key names should add any other key to stay a plain default.
 *
 * @param {unknown} value - Raw props entry.
 * @returns {boolean} Whether the entry is a descriptor.
 */
function isDescriptor(value) {
  if (!isPlainObject(value)) return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => DESCRIPTOR_KEYS.has(key));
}

/**
 * Normalizes a props entry — bare default or descriptor — into one definition shape.
 *
 * @param {string} key - Prop name.
 * @param {unknown} raw - Raw props entry.
 * @returns {{ key: string, attribute: string, type: Function | null, required: boolean, fallback: unknown }} Prop definition.
 */
function normalizeProp(key, raw) {
  if (isDescriptor(raw)) {
    const type = raw.type ?? String;
    return {
      key,
      attribute: `data-${toKebabCase(key)}`,
      type,
      required: raw.required === true,
      fallback: 'default' in raw ? raw.default : defaultForType(type),
    };
  }
  return { key, attribute: `data-${toKebabCase(key)}`, type: null, required: false, fallback: raw };
}

/**
 * Validates a descriptor's shape at define time — fail fast, before any element connects.
 *
 * @param {string} name - Prop name.
 * @param {{ type?: Function, default?: unknown, required?: boolean }} descriptor - Raw descriptor.
 * @returns {void}
 */
function validateDescriptor(name, descriptor) {
  if (descriptor.type !== undefined && !PROP_TYPES.has(descriptor.type)) {
    throw new TypeError(
      `[devinim] component(tag, config): prop "${name}" type must be String, Number, Boolean, Array or Object.`,
    );
  }
  if (descriptor.required !== undefined && typeof descriptor.required !== 'boolean') {
    throw new TypeError(`[devinim] component(tag, config): prop "${name}" required must be a boolean.`);
  }
  const type = descriptor.type ?? String;
  if ('default' in descriptor) {
    if (!isPropDefault(descriptor.default)) {
      throw new TypeError(
        `[devinim] component(tag, config): prop "${name}" default must be a string, number, boolean, array or plain object.`,
      );
    }
    if (!matchesType(descriptor.default, type)) {
      throw new TypeError(
        `[devinim] component(tag, config): prop "${name}" default does not match its declared ${type.name} type.`,
      );
    }
  }
}

/**
 * Runtime prop validation (ADR-0025): a meaningful `console.error` when a required attribute
 * is missing or an attribute value cannot convert to the declared type (the default applies
 * in that case — the page keeps working, the message tells the author exactly what to fix).
 *
 * @param {BaseComponent} host - Component instance owning the attribute.
 * @param {{ key: string, attribute: string, type: Function | null, required: boolean }} definition - Prop definition.
 * @returns {void}
 */
function checkProp(host, definition) {
  const tag = host.nodeName.toLowerCase();
  const raw = host.getAttribute(definition.attribute);
  if (raw === null) {
    if (definition.required) {
      console.error(
        `[devinim] <${tag}>: required prop "${definition.key}" is missing — set the ${definition.attribute} attribute.`,
      );
    }
    return;
  }
  const type = definition.type;
  let valid = true;
  if (type === Number) valid = raw.trim() !== '' && Number.isFinite(Number(raw));
  else if (type === Array) valid = jsonKind(raw) === Array;
  else if (type === Object) valid = jsonKind(raw) === Object;
  if (!valid) {
    console.error(
      `[devinim] <${tag}>: prop "${definition.key}" expected ${type.name} but ${definition.attribute}="${raw}" could not be converted — the default value applies instead.`,
    );
  }
}

/**
 * @param {unknown} value - Candidate default.
 * @param {Function} type - Descriptor type constructor.
 * @returns {boolean} Whether the default matches the declared type.
 */
function matchesType(value, type) {
  if (type === Array) return Array.isArray(value);
  if (type === Object) return isPlainObject(value);
  if (type === String) return typeof value === 'string';
  if (type === Number) return typeof value === 'number' && Number.isFinite(value);
  if (type === Boolean) return typeof value === 'boolean';
  return false;
}

/**
 * @param {Function} type - Descriptor type constructor.
 * @returns {unknown} The implicit default for a descriptor without an explicit `default`.
 */
function defaultForType(type) {
  if (type === Number) return 0;
  if (type === Boolean) return false;
  if (type === Array) return [];
  if (type === Object) return {};
  return '';
}

/**
 * @param {string} raw - Raw attribute value.
 * @returns {Function | null} Array or Object when the value parses to that JSON kind, else null.
 */
function jsonKind(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return Array;
    if (isPlainObject(parsed)) return Object;
    return null;
  } catch {
    return null;
  }
}
