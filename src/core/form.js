/** @module core/form - Small reactive form state for build-free application forms. */

import { createStore } from './store.js';
import { validate as validateValues } from './validate.js';

/**
 * Creates form state with values, server/client errors and an async submission lifecycle.
 * Validation remains plain JavaScript: call `setErrors()` from your own validator or PHP API.
 *
 * @param {Record<string, *>} initialValues - Initial field values.
 * @returns {{ state: { values: Record<string, *>, errors: Record<string, string>, status: 'idle' | 'submitting' | 'success' | 'error', dirty: boolean }, subscribe: (fn: (path: string) => void) => () => void, set: (name: string, value: *) => void, setErrors: (errors: Record<string, string>) => void, validate: (rules: Record<string, string | string[]>, messages?: Record<string, string>) => boolean, reset: () => void, submit: (handler: (values: Record<string, *>) => Promise<*>) => Promise<*> }} Form controller.
 */
export function createForm(initialValues = {}) {
  const seed = { ...initialValues };
  const store = createStore({ values: { ...seed }, errors: {}, status: 'idle', dirty: false });

  return {
    ...store,
    set(name, value) {
      store.state.values[name] = value;
      delete store.state.errors[name];
      store.state.dirty = true;
    },
    setErrors(errors) {
      store.state.errors = { ...errors };
      store.state.status = 'error';
    },
    /**
     * Validates current values against declarative rules (core/validate, ADR-0022). On failure
     * the errors land in `state.errors` and the status flips to `'error'` — the same shape the
     * server path uses, so one template branch renders both.
     *
     * @param {Record<string, string | string[]>} rules - e.g. `{ email: 'required|email' }`.
     * @param {Record<string, string>} [messages] - Optional message overrides.
     * @returns {boolean} True when the form is valid.
     */
    validate(rules, messages) {
      const errors = validateValues(store.state.values, rules, messages);
      if (Object.keys(errors).length === 0) {
        store.state.errors = {};
        return true;
      }
      store.state.errors = errors;
      store.state.status = 'error';
      return false;
    },
    reset() {
      store.state.values = { ...seed };
      store.state.errors = {};
      store.state.status = 'idle';
      store.state.dirty = false;
    },
    async submit(handler) {
      store.state.status = 'submitting';
      store.state.errors = {};
      try {
        const result = await handler({ ...store.state.values });
        store.state.status = 'success';
        store.state.dirty = false;
        return result;
      } catch (error) {
        store.state.status = 'error';
        if (error?.body?.errors && typeof error.body.errors === 'object') {
          store.state.errors = { ...error.body.errors };
        }
        throw error;
      }
    },
  };
}
