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
 *   onError?: (error: unknown, phase: 'render' | 'action') => void,
 * }} config - Factory component contract.
 * @returns {CustomElementConstructor} The registered custom-element constructor.
 */
export function component(tagName: string, config: {
    props?: Record<string, string | number | boolean | Array<unknown> | object>;
    state?: object | (() => object);
    sync?: Record<string, (value: unknown, previous: unknown) => void>;
    actions?: Record<string, (event?: Event, element?: Element) => void>;
    view: () => import("./html.js").HtmlString;
    connected?: () => void;
    reconnected?: () => void;
    disconnected?: () => void;
    updated?: (changedKeys: string[]) => void;
    onError?: (error: unknown, phase: "render" | "action") => void;
}): CustomElementConstructor;
