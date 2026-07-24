/**
 * @module components/dv-tabs
 * `<dv-tabs>` — WAI-ARIA tabs (APG pattern, automatic activation). The accessibility
 * reference component of DevinimJS (ADR-0010).
 *
 * Panels are ordinary light-DOM children printed by the backend; labels come from their
 * `data-tab` attributes — the HTML *is* the API:
 *
 * @example
 * <dv-tabs data-active="0" data-label="Account settings">
 *   <div data-tab="General"><p>…panel HTML from PHP…</p></div>
 *   <div data-tab="Profile"><p>…</p></div>
 * </dv-tabs>
 *
 * Keyboard (per ARIA Authoring Practices Guide): ArrowRight/ArrowLeft move between tabs
 * (wrapping), Home/End jump to first/last. Activation is automatic: focusing a tab selects it.
 *
 * @fires CustomEvent#dv:tab - After every activation change; `detail: { index: number }`.
 */

import { BaseComponent, html, define } from '../core/core.js';
import { t, registerLocales, onLocaleChange } from '../core/i18n.js';
import locales from './dv-tabs.locale.js';

registerLocales('dv-tabs', locales);

/** Per-page instance sequence — keeps generated ids unique across multiple <dv-tabs>. */
let instanceSeq = 0;

/**
 * Accessible tabbed interface.
 *
 * Attributes:
 * - `data-active` (number, default 0) — active tab index; live-synced (ADR-0005).
 * - `data-label` (string, default "Tabs") — accessible name of the tablist.
 *
 * Children: each child element becomes one tabpanel; its `data-tab` attribute is the tab
 * label (fallback: `Tab N`). The component manages `hidden`/ARIA on its panel children —
 * documented exception to "outlet content is consumer-owned".
 */
export class DvTabs extends BaseComponent {
  /** @returns {string[]} Live-synced attributes. */
  static observedAttributes = ['data-active'];

  /** @type {number} Unique per-page instance id for ARIA wiring. */
  #instanceId = ++instanceSeq;

  /** @type {string[]} Tab labels captured from child `data-tab` attributes. */
  #labels = [];

  /**
   * Reads tab labels from the captured light-DOM children (ADR-0009 amendment).
   *
   * @param {DocumentFragment | null} fragment - Captured initial children.
   * @returns {void}
   */
  prepare(fragment) {
    this.#labels = fragment
      ? Array.from(fragment.children).map((el, i) => el.getAttribute('data-tab') ?? `Tab ${i + 1}`)
      : [];
  }

  /**
   * @returns {{ active: number, labels: string[] }} Initial state (active clamped to range).
   */
  initialState() {
    return { active: this.#clamp(this.num('active', 0)), labels: [...this.#labels] };
  }

  /**
   * Reflects live `data-active` changes (ADR-0005 #4).
   *
   * @param {string} name - Attribute name.
   * @param {string | null} newValue - New value.
   * @returns {void}
   */
  onAttribute(name, newValue) {
    if (name === 'data-active') this.activateIndex(Number(newValue) || 0);
  }

  /** Sets ARIA wiring and visibility on the outlet panels after the first render, and subscribes to locale changes (ADR-0019). */
  connected() {
    this.#syncPanels();
    this.onCleanup(onLocaleChange(() => this.requestUpdate()));
  }

  /**
   * Re-syncs panels and moves focus with the selected tab (automatic activation).
   *
   * @param {string[]} changedKeys - Root state keys changed in this batch.
   * @returns {void}
   */
  updated(changedKeys) {
    if (!changedKeys.includes('active')) return;
    this.#syncPanels();
    this.#activeTab()?.focus();
  }

  /**
   * Click handler for tabs (`data-on:click="activate"`).
   *
   * @param {Event} _event - DOM event (unused; index comes from the element).
   * @param {Element} el - The clicked tab button.
   * @returns {void}
   */
  activate(_event, el) {
    this.activateIndex(Number(el.getAttribute('data-index')));
  }

  /**
   * Keyboard navigation per APG: ArrowRight/ArrowLeft (wrapping), Home, End.
   *
   * @param {KeyboardEvent} event - The keydown event.
   * @returns {void}
   */
  onKeydown(event) {
    const last = this.state.labels.length - 1;
    if (last < 0) return;
    let next = null;
    switch (event.key) {
      case 'ArrowRight':
        next = this.state.active >= last ? 0 : this.state.active + 1;
        break;
      case 'ArrowLeft':
        next = this.state.active <= 0 ? last : this.state.active - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.activateIndex(next);
  }

  /**
   * Focus synchronization (APG automatic activation): a tab receiving focus becomes active.
   * Covers screen-reader virtual cursors and programmatic focus; loop-safe because
   * `activateIndex` no-ops on the current index.
   *
   * @param {Event} _event - DOM event (unused).
   * @param {Element} el - The focused tab button.
   * @returns {void}
   */
  onFocusin(_event, el) {
    this.activateIndex(Number(el.getAttribute('data-index')));
  }

  /**
   * Programmatic activation (clamped); emits `dv:tab` on change.
   *
   * @param {number} index - Target tab index.
   * @returns {void}
   */
  activateIndex(index) {
    const next = this.#clamp(index);
    if (next === this.state.active) return;
    this.state.active = next;
    this.emit('tab', { index: next });
  }

  /**
   * Note: `aria-selected` uses `String(...)` — ARIA states need explicit "true"/"false",
   * so the boolean-attribute shorthand (ADR-0002 #5) must NOT apply here.
   *
   * @returns {import('../core/html.js').HtmlString} The tabs template.
   */
  template() {
    return html`
      <div role="tablist" aria-label="${t(this, 'label', 'Tabs')}">
        ${this.state.labels.map((label, i) => html`
          <button type="button" role="tab"
            id="${this.#tabId(i)}"
            aria-selected="${String(i === this.state.active)}"
            aria-controls="${this.#panelId(i)}"
            tabindex="${i === this.state.active ? 0 : -1}"
            data-index="${i}"
            data-on:click="activate"
            data-on:keydown="onKeydown"
            data-on:focusin="onFocusin">${label}</button>
        `)}
      </div>
      <div class="dv-tabs-panels">${this.outlet}</div>
    `;
  }

  /**
   * Clamps an index into the valid tab range (empty tabset → 0).
   *
   * @param {number} index - Requested index.
   * @returns {number} Clamped index.
   */
  #clamp(index) {
    const last = this.#labels.length - 1;
    if (!Number.isFinite(index) || index < 0) return 0;
    return Math.min(index, Math.max(last, 0));
  }

  /**
   * Applies the tabpanel contract to outlet children: role, id, aria-labelledby, tabindex
   * and `hidden` for inactive panels.
   *
   * @returns {void}
   */
  #syncPanels() {
    const outlet = this.querySelector('dv-outlet');
    if (!outlet) return;
    Array.from(outlet.children).forEach((panel, i) => {
      panel.setAttribute('role', 'tabpanel');
      panel.id = this.#panelId(i);
      panel.setAttribute('aria-labelledby', this.#tabId(i));
      panel.tabIndex = 0;
      panel.hidden = i !== this.state.active;
    });
  }

  /**
   * @returns {Element | null} The currently selected tab button.
   */
  #activeTab() {
    return this.querySelector('[role="tab"][aria-selected="true"]');
  }

  /**
   * @param {number} i - Tab index.
   * @returns {string} Unique tab id for ARIA wiring.
   */
  #tabId(i) {
    return `dv-tabs-${this.#instanceId}-tab-${i}`;
  }

  /**
   * @param {number} i - Panel index.
   * @returns {string} Unique panel id for ARIA wiring.
   */
  #panelId(i) {
    return `dv-tabs-${this.#instanceId}-panel-${i}`;
  }
}

define('dv-tabs', DvTabs);
