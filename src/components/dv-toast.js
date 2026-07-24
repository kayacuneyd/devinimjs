/** @module components/dv-toast - Accessible, self-timed status notification. */

import { BaseComponent, html, define } from '../core/core.js';
import { awaitTransition } from '../core/transition.js';

/** Status toast for page-level or component-level feedback. */
export class DvToast extends BaseComponent {
  static observedAttributes = ['data-message', 'data-open'];

  #timer = null;

  /**
   * @type {boolean} DOM-presence flag (ADR-0018) driving the `hidden` attribute — decoupled
   * from the public `state.open` so the toast stays mounted and visible through its exit
   * transition after `state.open` has already flipped to `false`.
   */
  #visible = false;

  /**
   * @type {number} Bumped on every show/hide so a stale hide (superseded by a re-show before
   * its exit transition finished) never applies its now-outdated `#visible = false`.
   */
  #closeToken = 0;

  /** @returns {{ open: boolean, message: string }} Initial toast state. */
  initialState() {
    const open = this.bool('open', false);
    this.#visible = open;
    return { open, message: this.str('message', '') };
  }

  /** Starts auto-dismiss for an initially open toast. */
  connected() {
    if (this.state.open) this.#scheduleDismiss();
  }

  /**
   * @param {string} name - Changed attribute.
   * @param {string | null} newValue - New value.
   */
  onAttribute(name, newValue) {
    if (name === 'data-message') this.state.message = newValue ?? '';
    if (name === 'data-open') {
      const open = newValue !== null && newValue !== 'false' && newValue !== '0';
      if (open === this.state.open) return;
      this.state.open = open;
      this.#applyVisibility(open);
    }
  }

  /**
   * Shows a message and restarts its auto-dismiss timer.
   * @param {string} message - Message text.
   */
  show(message) {
    this.state.message = message;
    this.state.open = true;
    this.#scheduleDismiss();
    this.emit('show', { message });
    this.#applyVisibility(true);
  }

  /** Hides the toast. */
  hide() {
    if (!this.state.open) return;
    this.state.open = false;
    this.#clearTimer();
    this.emit('hide');
    this.#applyVisibility(false);
  }

  /**
   * Applies the DOM-presence side of a show/hide change (ADR-0018). Showing is immediate —
   * `hidden` comes off in the same render as `state.open` flips, exactly as before this
   * primitive existed. Hiding keeps the toast mounted and visible until its exit transition (or
   * the primitive's timeout fallback) resolves, then removes it.
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
    const el = this.querySelector('.dv-toast');
    if (!el) {
      this.#visible = false;
      this.requestUpdate();
      return;
    }
    awaitTransition(el).then(() => {
      // A re-show before the exit transition finished bumped #closeToken — this resolution is
      // for a hide that no longer applies, so it must not hide the now-reshown toast.
      if (token !== this.#closeToken) return;
      this.#visible = false;
      this.requestUpdate();
    });
  }

  /** @returns {import('../core/html.js').HtmlString} Toast markup. */
  template() {
    return html`<output class="dv-toast" role="status" aria-live="polite" hidden="${!this.#visible}" data-leaving="${this.#visible && !this.state.open}">${this.state.message}</output>`;
  }

  /** Schedules a timer that is cleaned up automatically on disconnect. */
  #scheduleDismiss() {
    this.#clearTimer();
    const duration = this.num('duration', 5000);
    if (duration <= 0) return;
    this.#timer = setTimeout(() => this.hide(), duration);
    this.onCleanup(() => this.#clearTimer());
  }

  /** Clears the active auto-dismiss timer. */
  #clearTimer() {
    if (this.#timer !== null) clearTimeout(this.#timer);
    this.#timer = null;
  }
}

define('dv-toast', DvToast);
