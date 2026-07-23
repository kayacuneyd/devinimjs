/**
 * Creates a stale-safe async resource. A newer `run()` call always wins over an older request
 * that settles later.
 *
 * @template T
 * @param {T | null} [initialData] - Initial successful data, when available.
 * @returns {{ state: { status: 'idle' | 'loading' | 'success' | 'error', data: T | null, error: unknown }, subscribe: (fn: (path: string) => void) => () => void, run: (task: (() => Promise<T>) | Promise<T>) => Promise<T>, reset: () => void }} Async resource.
 */
export function createAsyncState<T>(initialData?: T | null): {
    state: {
        status: "idle" | "loading" | "success" | "error";
        data: T | null;
        error: unknown;
    };
    subscribe: (fn: (path: string) => void) => () => void;
    run: (task: (() => Promise<T>) | Promise<T>) => Promise<T>;
    reset: () => void;
};
