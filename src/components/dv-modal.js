/**
 * @module components/dv-modal
 * Light-DOM modal dialog. Styling is intentionally delegated to the consumer's global CSS.
 */

import { BaseComponent, html, define } from '../core/core.js';
import { awaitTransition } from '../core/transition.js';
import { t, registerLocales, onLocaleChange } from '../core/i18n.js';
import locales from './dv-modal.locale.js';

registerLocales('dv-modal', locales);

let instanceSeq = 0;

/**
 * Standard focusable-element selector (WAI-ARIA APG dialog pattern). Elements deliberately
 * pulled out of the tab order with `tabindex="-1"` (e.g. the dialog wrapper itself, the
 * initial-open focus target) are excluded — they're programmatic focus targets, not part of the
 * trap's Tab cycle.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

/**
 * Module-level stack of currently open `<dv-modal>` instances, most-recently-opened last.
 * Opening a second dialog while another is already open (e.g. a confirmation dialog launched
 * from within a form dialog) is a legitimate pattern, but only one dialog should ever own the
 * Tab trap at a time — a background dialog's key handling must not fight the foreground one
 * (WAI-ARIA APG). A plain stack is enough for that: `onKeydown`'s trap logic only runs when
 * `this` is the top entry, so the most recently opened modal automatically owns Tab until it
 * closes, at which point the previous top resumes control. Deliberately not a full modal-manager
 * abstraction (no inert-marking of background content, no z-index/backdrop concerns) — those are
 * out of this gap's scope.
 *
 * @type {DvModal[]}
 */
const openStack = [];

/** @param {DvModal} instance - Modal instance to bring to the top of the open stack. */
function pushOpenStack(instance) {
  const index = openStack.indexOf(instance);
  if (index !== -1) openStack.splice(index, 1);
  openStack.push(instance);
}

/** @param {DvModal} instance - Modal instance to remove from the open stack. */
function removeOpenStack(instance) {
  const index = openStack.indexOf(instance);
  if (index !== -1) openStack.splice(index, 1);
}

/** Accessible modal dialog: Escape to close, close-button, and a WAI-ARIA APG Tab focus trap. */
export class DvModal extends BaseComponent {
  /** @returns {string[]} Live-synced attributes. */
  static observedAttributes = ['data-open'];

  #instanceId = ++instanceSeq;
  #opener = null;

  /**
   * @type {boolean} DOM-presence flag (ADR-0018) driving the `hidden` attribute — decoupled
   * from the public `state.open` so the backdrop can stay mounted and visible through its exit
   * transition after `state.open` has already flipped to `false`.
   */
  #visible = false;

  /**
   * @type {number} Bumped on every open/close so a stale close (superseded by a re-open
   * before its exit transition finished) never applies its now-outdated `#visible = false`.
   */
  #closeToken = 0;

  /** @returns {{ open: boolean }} Initial modal state. */
  initialState() {
    const open = this.bool('open', false);
    this.#visible = open;
    return { open };
  }

  /** Focuses an initially open dialog and registers it atop the open-modal stack. */
  connected() {
    if (this.state.open) {
      pushOpenStack(this);
      this.#focusDialog();
    }
    this.onCleanup(onLocaleChange(() => this.requestUpdate()));
  }

  /** Removes this instance from the open-modal stack when it leaves the document. */
  disconnected() {
    removeOpenStack(this);
  }

  /** @param {string[]} changedKeys - State keys changed in the render batch. */
  updated(changedKeys) {
    if (!changedKeys.includes('open')) return;
    if (this.state.open) {
      pushOpenStack(this);
      this.#focusDialog();
    } else {
      removeOpenStack(this);
      this.#opener?.focus();
    }
  }

  /**
   * @param {string} name - Changed attribute.
   * @param {string | null} newValue - New value.
   */
  onAttribute(name, newValue) {
    if (name !== 'data-open') return;
    const open = newValue !== null && newValue !== 'false' && newValue !== '0';
    if (open === this.state.open) return;
    this.state.open = open;
    this.#applyVisibility(open);
  }

  /**
   * @param {Event} _event - Triggering event.
   * @param {Element} el - Opening control.
   */
  open(_event, el) {
    this.#opener = el instanceof HTMLElement ? el : document.activeElement;
    this.#setOpen(true);
  }

  /** Closes the dialog and restores focus to its recorded opener. */
  close() {
    this.#setOpen(false);
  }

  /** @param {KeyboardEvent} event - Dialog key event. */
  onKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    // Every open <dv-modal>'s onKeydown is wired the same way, but only the topmost entry in
    // `openStack` may act on Tab — see the comment on `openStack` for why.
    if (event.key === 'Tab' && openStack[openStack.length - 1] === this) {
      this.#trapTab(event);
    }
  }

  /** @param {boolean} open - Desired open state. */
  #setOpen(open) {
    if (open === this.state.open) return;
    this.state.open = open;
    this.emit(open ? 'open' : 'close');
    this.#applyVisibility(open);
  }

  /**
   * Applies the DOM-presence side of an open/close change (ADR-0018). Opening is immediate —
   * `hidden` comes off in the same render as `state.open` flips, exactly as before this
   * primitive existed. Closing keeps the backdrop mounted and visible until its exit
   * transition (or the primitive's timeout fallback) resolves, then removes it.
   *
   * @param {boolean} open - The new `state.open` value this call is reacting to.
   */
  #applyVisibility(open) {
    this.#closeToken += 1;
    if (open) {
      this.#visible = true;
      this.requestUpdate();
      return;
    }
    const token = this.#closeToken;
    const backdrop = this.querySelector('.dv-modal-backdrop');
    if (!backdrop) {
      this.#visible = false;
      this.requestUpdate();
      return;
    }
    awaitTransition(backdrop).then(() => {
      // A re-open before the exit transition finished bumped #closeToken — this resolution is
      // for a close that no longer applies, so it must not hide the now-reopened dialog.
      if (token !== this.#closeToken) return;
      this.#visible = false;
      this.requestUpdate();
    });
  }

  /** Queues focus until the dialog is visible in the patched DOM. */
  #focusDialog() {
    queueMicrotask(() => this.querySelector('[role="dialog"]')?.focus());
  }

  /**
   * Cycles Tab/Shift+Tab within the dialog's focusable descendants (WAI-ARIA APG dialog
   * pattern): Tab from the last one wraps to the first, Shift+Tab from the first wraps to the
   * last. Also catches the initial-open case (focus starts on the dialog wrapper itself, which
   * is excluded from `FOCUSABLE_SELECTOR`) and the pathological "focus already outside the
   * dialog" case — both are treated as being at the relevant edge.
   *
   * @param {KeyboardEvent} event - The Tab keydown event.
   */
  #trapTab(event) {
    const focusable = this.#focusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    const atEdge = event.shiftKey ? active === first : active === last;
    if (atEdge || !focusable.includes(active)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  }

  /** @returns {HTMLElement[]} This dialog's currently focusable descendants, in DOM order. */
  #focusableElements() {
    const dialog = this.querySelector('[role="dialog"]');
    if (!dialog) return [];
    return [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)].filter((el) => !el.hidden);
  }

  /** @returns {import('../core/html.js').HtmlString} Modal markup. */
  template() {
    const titleId = `dv-modal-${this.#instanceId}-title`;
    return html`
      <div class="dv-modal-backdrop" hidden="${!this.#visible}"
        data-leaving="${this.#visible && !this.state.open}">
        <section class="dv-modal" role="dialog" aria-modal="true" aria-labelledby="${titleId}"
          tabindex="-1" data-on:keydown="onKeydown">
          <header>
            <h2 id="${titleId}">${t(this, 'label', 'Dialog')}</h2>
            <button type="button" aria-label="${t(this, 'close', 'Close')}" data-on:click="close">×</button>
          </header>
          <div class="dv-modal-content">${this.outlet}</div>
        </section>
      </div>
    `;
  }
}

define('dv-modal', DvModal);
