/** @module components/__TAG__ */

import { BaseComponent, html, define } from '../core/core.js';

/** __DESCRIPTION__. */
export class __CLASS__ extends BaseComponent {
  /** @returns {object} Initial reactive state. */
  initialState() {
    return {};
  }

  /** @returns {import('../core/html.js').HtmlString} Component markup. */
  template() {
    return html`<div>${this.outlet}</div>`;
  }
}

define('__TAG__', __CLASS__);
