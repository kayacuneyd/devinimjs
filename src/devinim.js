/**
 * @module devinim
 * All-in-one entry: the full core API plus every framework component, self-registering
 * (importing a component module runs its `define()` call). For per-module consumption,
 * import from `core/core.js` and individual `components/*.js` files instead (ADR-0007).
 *
 * @example
 * import 'devinim/devinim.js'; // registers <dv-counter>, … and exposes the core API
 */
export * from './core/core.js';
export { DvCounter } from './components/dv-counter.js';
export { DvTabs } from './components/dv-tabs.js';
export { DvDisclosure } from './components/dv-disclosure.js';
export { DvModal } from './components/dv-modal.js';
export { DvToast } from './components/dv-toast.js';
export { DvPagination } from './components/dv-pagination.js';
