/**
 * Creates form state with values, server/client errors and an async submission lifecycle.
 * Validation remains plain JavaScript: call `setErrors()` from your own validator or PHP API.
 *
 * @param {Record<string, *>} initialValues - Initial field values.
 * @returns {{ state: { values: Record<string, *>, errors: Record<string, string>, status: 'idle' | 'submitting' | 'success' | 'error', dirty: boolean }, subscribe: (fn: (path: string) => void) => () => void, set: (name: string, value: *) => void, setErrors: (errors: Record<string, string>) => void, reset: () => void, submit: (handler: (values: Record<string, *>) => Promise<*>) => Promise<*> }} Form controller.
 */
export function createForm(initialValues?: Record<string, any>): {
    state: {
        values: Record<string, any>;
        errors: Record<string, string>;
        status: "idle" | "submitting" | "success" | "error";
        dirty: boolean;
    };
    subscribe: (fn: (path: string) => void) => () => void;
    set: (name: string, value: any) => void;
    setErrors: (errors: Record<string, string>) => void;
    reset: () => void;
    submit: (handler: (values: Record<string, any>) => Promise<any>) => Promise<any>;
};
