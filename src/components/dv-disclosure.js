/**
 * @module components/dv-disclosure
 * Accessible show/hide content with a PHP-friendly light-DOM children API.
 */

import { BaseComponent, html, define } from '../core/core.js';
import { awaitTransition } from '../core/transition.js';

let instanceSeq = 0;

/** Accessible disclosure component. */
export class DvDisclosure extends BaseComponent {
  /** @returns {string[]} Live-synced attributes. */
  static observedAttributes = ['data-open'];

  #instanceId = ++instanceSeq;

  /**
   * @type {boolean} DOM-presence flag (ADR-0018) driving the panel's `hidden` attribute —
   * decoupled from the public `state.open` so the panel stays mounted and visible through its
   * collapse transition after `state.open` has already flipped to `false`.
   */
  #visible = false;

  /**
   * @type {number} Bumped on every toggle so a stale collapse (superseded by a re-expand
   * before its transition finished) never applies its now-outdated `#visible = false`.
   */
  #closeToken = 0;

  /** @returns {{ open: boolean }} Initial disclosure state. */
  initialState() {
    const open = this.bool('open', false);
    this.#visible = open;
    return { open };
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

  /** Toggles content visibility and emits `dv:toggle`. */
  toggle() {
    this.state.open = !this.state.open;
    this.emit('toggle', { open: this.state.open });
    this.#applyVisibility(this.state.open);
  }

  /**
   * Applies the DOM-presence side of an expand/collapse change (ADR-0018). Expanding is
   * immediate — `hidden` comes off in the same render as `state.open` flips, exactly as before
   * this primitive existed. Collapsing keeps the panel mounted and visible until its exit
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
    const panel = this.querySelector('.dv-disclosure-panel');
    if (!panel) {
      this.#visible = false;
      this.requestUpdate();
      return;
    }
    awaitTransition(panel).then(() => {
      // A re-expand before the collapse transition finished bumped #closeToken — this
      // resolution is for a collapse that no longer applies.
      if (token !== this.#closeToken) return;
      this.#visible = false;
      this.requestUpdate();
    });
  }

  /** @returns {import('../core/html.js').HtmlString} Disclosure markup. */
  template() {
    const panelId = `dv-disclosure-${this.#instanceId}-panel`;
    return html`
      <button type="button" aria-expanded="${String(this.state.open)}" aria-controls="${panelId}"
        data-on:click="toggle">${this.str('summary', 'Details')}</button>
      <div id="${panelId}" class="dv-disclosure-panel" hidden="${!this.#visible}"
        data-leaving="${this.#visible && !this.state.open}">${this.outlet}</div>
    `;
  }
}

define('dv-disclosure', DvDisclosure);
