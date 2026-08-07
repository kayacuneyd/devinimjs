/**
 * Media upload widget: a drop zone plus a file list with thumbnails, per-file progress and
 * abort. Client-side validation mirrors the CI4 endpoint's rules (`data-accept`,
 * `data-max-size`) so bad files never leave the browser; the server remains the authority.
 *
 * Configuration (`data-*`): `endpoint` (required), `accept`, `max-size` (bytes, 0 = unlimited),
 * `multiple`, `auto` (upload immediately, default true), `name` (form field, default `file`),
 * `csrf-token` (default: `<meta name="csrf-token">`).
 *
 * Events: `dv:added` ({ files }), `dv:uploaded` ({ name, response }), `dv:error`
 * ({ name, reason }), `dv:remove` ({ name }).
 */
export class DvMediaUpload extends BaseComponent {
    /** @returns {{ files: object[], dragging: boolean }} Initial state. */
    initialState(): {
        files: object[];
        dragging: boolean;
    };
    /**
     * Adds files from an input change or a drop. Invalid files are rejected with a `dv:error`
     * event (never uploaded); in single-file mode the list is replaced. With `data-auto`
     * (default) each accepted file uploads immediately.
     *
     * @param {FileList | File[]} fileList - Files to add.
     * @returns {void}
     */
    addFiles(fileList: FileList | File[]): void;
    /**
     * Uploads one queued entry via XHR with progress (createApi). **Transport seam:** override
     * this method to customize the upload (chunking, a different driver, test doubles).
     *
     * @param {object} entry - A live entry from `state.files`.
     * @returns {Promise<void>} Resolves when the entry reaches a terminal status.
     */
    upload(entry: object): Promise<void>;
    /** Opens the native file picker (drop zone click / keyboard). @returns {void} */
    openPicker(): void;
    /**
     * Keyboard access for the drop zone: Enter or Space opens the picker.
     *
     * @param {KeyboardEvent} event - Keydown event.
     * @returns {void}
     */
    onZoneKey(event: KeyboardEvent): void;
    /**
     * @param {Event} _event - Change event (unused; the input carries the files).
     * @param {HTMLInputElement} input - The hidden file input.
     * @returns {void}
     */
    onPick(_event: Event, input: HTMLInputElement): void;
    /** @returns {void} */
    onDragOver(): void;
    /** @returns {void} */
    onDragLeave(): void;
    /**
     * @param {DragEvent} event - Drop event (default already prevented by the directive).
     * @returns {void}
     */
    onDrop(event: DragEvent): void;
    /** Uploads every queued entry (used when `data-auto="false"`). @returns {void} */
    startAll(): void;
    /**
     * Aborts an in-flight upload; the entry returns to `queued` so it can be retried.
     *
     * @param {Event} _event - Click event (unused; the button carries `data-id`).
     * @param {Element} el - The abort button carrying `data-id`.
     * @returns {void}
     */
    abortFile(_event: Event, el: Element): void;
    /**
     * Removes an entry (aborting its upload first when in flight).
     *
     * @param {Event} _event - Click event (unused; the button carries `data-id`).
     * @param {Element} el - The remove button carrying `data-id`.
     * @returns {void}
     */
    removeFile(_event: Event, el: Element): void;
    #private;
}
import { BaseComponent } from '../core/core.js';
