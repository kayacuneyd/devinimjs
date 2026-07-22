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
 *   props?: Record<string, string | number | boolean | Array<unknown> | object>,
 *   state?: object | (() => object),
 *   sync?: Record<string, (value: unknown, previous: unknown) => void>,
 *   actions?: Record<string, (event?: Event, element?: Element) => void>,
 *   view: () => import('./html.js').HtmlString,
 *   connected?: () => void,
 *   reconnected?: () => void,
 *   disconnected?: () => void,
 *   updated?: (changedKeys: string[]) => void,
 * }} config - Factory component contract.
 * @returns {CustomElementConstructor} The registered custom-element constructor.
 */
export function component(tagName, config) {
  validateConfig(tagName, config);
  const propDefinitions = Object.entries(config.props ?? {}).map(([key, fallback]) => ({
    key,
    fallback,
    attribute: `data-${toKebabCase(key)}`,
  }));
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
  for (const [name, fallback] of Object.entries(config.props ?? {})) {
    if (!/^[A-Za-z_$][\w$]*$/.test(name)) {
      throw new TypeError(`[devinim] component(tag, config): prop "${name}" must be a JavaScript identifier.`);
    }
    if (!isPropDefault(fallback)) {
      throw new TypeError(
        `[devinim] component(tag, config): prop "${name}" must default to a string, number, boolean, array or plain object.`,
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
  for (const hook of ['connected', 'reconnected', 'disconnected', 'updated']) {
    if (config[hook] !== undefined && typeof config[hook] !== 'function') {
      throw new TypeError(`[devinim] component(tag, config): ${hook} must be a function.`);
    }
  }
}

/**
 * Reads a data-* prop through BaseComponent's existing typed attribute helpers.
 *
 * @param {BaseComponent} host - Component instance owning the attribute.
 * @param {{ key: string, fallback: unknown }} definition - Prop metadata.
 * @returns {unknown} Parsed prop value.
 */
function readProp(host, definition) {
  const { key, fallback } = definition;
  if (typeof fallback === 'number') return host.num(key, fallback);
  if (typeof fallback === 'boolean') return host.bool(key, fallback);
  if (Array.isArray(fallback) || isPlainObject(fallback)) return host.json(key, cloneDefault(fallback));
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
