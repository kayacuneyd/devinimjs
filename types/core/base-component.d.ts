/**
 * Base class for all DevinimJS components. Light DOM only — never call attachShadow.
 */
export class BaseComponent extends HTMLElement {
    /**
     * Runs once between child capture and `initialState()`. Components whose configuration
     * lives in their light-DOM children (e.g. `<dv-tabs>` reading `data-tab` labels) inspect
     * the captured fragment here (ADR-0009 amendment). Default: no-op.
     *
     * @param {DocumentFragment | null} fragment - Captured initial children (null when none).
     * @returns {void}
     */
    prepare(fragment: DocumentFragment | null): void;
    /**
     * Returns the initial state object. Runs once at connect time; `this.dataset` and the
     * `str/num/bool/json` helpers are safe to use here.
     *
     * @returns {object} Initial state (default: empty object).
     */
    initialState(): object;
    /**
     * Returns the component's template. Must return an {@link HtmlString} produced by `html`.
     *
     * @returns {HtmlString} Template output.
     */
    template(): HtmlString;
    /** Called once, after the first render. Override for setup (timers, external listeners). */
    connected(): void;
    /** Called on every re-attachment after the first initialization. */
    reconnected(): void;
    /** Called when the element leaves the document. Override for cleanup. */
    disconnected(): void;
    /**
     * Called after each state-driven re-render (not after the first render — use `connected`).
     *
     * @param {string[]} changedKeys - Deduplicated root state keys that changed in this batch.
     * @returns {void}
     */
    updated(changedKeys: string[]): void;
    /**
     * Called when an observed attribute changes after initialization. Declare
     * `static observedAttributes = ['data-…']` and sync state here explicitly (ADR-0005).
     *
     * @param {string} name - Attribute name (e.g. `'data-start'`).
     * @param {string | null} newValue - New value (`null` when removed).
     * @param {string | null} oldValue - Previous value.
     * @returns {void}
     */
    onAttribute(name: string, newValue: string | null, oldValue: string | null): void;
    /**
     * Called when `template()` throws during a render, or an action method throws during
     * dispatch (ADR-0015). Default: re-throws, so an uncaught error surfaces exactly as it did
     * before this hook existed — override to contain it (render a fallback state, report to a
     * monitoring endpoint) instead of leaving the error uncaught.
     *
     * @param {unknown} error - The thrown value (usually an Error).
     * @param {'render' | 'action'} phase - Where the error originated.
     * @returns {void}
     */
    onError(error: unknown, phase: "render" | "action"): void;
    /**
     * The reactive state proxy. Mutate it directly — rendering follows automatically.
     *
     * @type {object}
     */
    get state(): object;
    /**
     * Standard callback — do not override; use `connected()` instead. Initializes state,
     * performs the first render, captures outlet children.
     *
     * @returns {void}
     */
    connectedCallback(): void;
    /**
     * Standard callback — do not override; use `disconnected()` instead.
     *
     * @returns {void}
     */
    disconnectedCallback(): void;
    /**
     * Standard callback — do not override; use `onAttribute()` instead. Changes arriving
     * before connect are ignored: `initialState()` reads current values anyway (ADR-0005 #4).
     *
     * @param {string} name - Attribute name.
     * @param {string | null} oldValue - Previous value.
     * @param {string | null} newValue - New value.
     * @returns {void}
     */
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
    /**
     * Schedules a re-render without a state change (ADR-0011 #4). The batch reaches `updated()`
     * with `['<external>']`. Escape hatch for external data sources — stores, timers, sockets.
     *
     * @returns {void}
     */
    requestUpdate(): void;
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
    useStore(store: {
        subscribe: (fn: (path: string) => void) => () => void;
    }, paths?: string | string[] | ((path: string) => boolean)): () => void;
    /**
     * Registers cleanup work for this connection. It runs automatically when the component leaves
     * the document and is useful for timers, observers and third-party subscriptions.
     *
     * @param {() => void} cleanup - Function to run at disconnect time.
     * @returns {() => void} Removes the cleanup without running it.
     */
    onCleanup(cleanup: () => void): () => void;
    /**
     * Adds an event listener that is removed automatically on disconnect.
     *
     * @param {EventTarget} target - Event target to observe.
     * @param {string} type - Event type.
     * @param {EventListenerOrEventListenerObject} listener - Listener to register.
     * @param {boolean | AddEventListenerOptions} [options] - Native listener options.
     * @returns {() => void} Removes the listener early.
     */
    listen(target: EventTarget, type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): () => void;
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
    emit(name: string, detail?: any): void;
    /**
     * Outlet marker for initial light-DOM children. Place `${this.outlet}` in `template()`
     * where the captured children should live (ADR-0009).
     *
     * @type {HtmlString}
     */
    get outlet(): HtmlString;
    /**
     * Reads a `data-*` value as string. `data-page-title` → key `'pageTitle'`.
     *
     * @param {string} key - camelCase dataset key.
     * @param {string} [fallback] - Value when the attribute is absent.
     * @returns {string} The attribute value or fallback.
     */
    str(key: string, fallback?: string): string;
    /**
     * Reads a `data-*` value as a finite number.
     *
     * @param {string} key - camelCase dataset key.
     * @param {number} [fallback] - Value when absent or not a finite number.
     * @returns {number} The coerced number or fallback.
     */
    num(key: string, fallback?: number): number;
    /**
     * Reads a `data-*` value as boolean. `'false'` and `'0'` are false; any other present
     * value (including empty) is true.
     *
     * @param {string} key - camelCase dataset key.
     * @param {boolean} [fallback] - Value when the attribute is absent.
     * @returns {boolean} The coerced boolean or fallback.
     */
    bool(key: string, fallback?: boolean): boolean;
    /**
     * Reads a `data-*` value as parsed JSON. Warns and falls back on invalid JSON. Never
     * returns HtmlString — attributes carry data, never markup (ADR-0003 #4).
     *
     * @param {string} key - camelCase dataset key.
     * @param {*} [fallback] - Value when absent or unparseable.
     * @returns {*} The parsed value or fallback.
     */
    json(key: string, fallback?: any): any;
    #private;
}
import { HtmlString } from './html.js';
