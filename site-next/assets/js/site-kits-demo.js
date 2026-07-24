/* global document */

import '../../../dist/modules/dv-data-table.js';
import '../../../dist/modules/dv-pagination.js';
import '../../../dist/modules/dv-modal.js';
import '../../../dist/modules/dv-field.js';
import '../../../dist/modules/dv-confirm.js';
import '../../../dist/modules/dv-toast-stack.js';
import '../../../dist/modules/dv-state.js';

// Live "admin-dashboard" kit demo (kits/admin-dashboard/, ADR-0020). Every dv-* element here
// stays on its documented data-*/event contract — this file is page-owned glue, not a framework
// feature, identical in shape to the generated kit's own inline script.
const table = document.querySelector('#kit-projects-table');
const emptyState = document.querySelector('#kit-empty-state');
const toasts = document.querySelector('#kit-toasts');
const modal = document.querySelector('#kit-new-project-modal');
const form = document.querySelector('#kit-new-project-form');
const fieldName = document.querySelector('#kit-field-name');
const fieldOwner = document.querySelector('#kit-field-owner');
const fieldStatus = document.querySelector('#kit-field-status');
const deleteSelect = document.querySelector('#kit-delete-select');
const deleteConfirm = document.querySelector('#kit-delete-confirm');

if (table) {
  /** @returns {object[]} The table's current row data, parsed from its data-rows attribute. */
  const rows = () => JSON.parse(table.getAttribute('data-rows') ?? '[]');

  /** @param {object[]} nextRows - Full replacement row set. */
  const setRows = (nextRows) => {
    table.setAttribute('data-rows', JSON.stringify(nextRows));
    emptyState.hidden = nextRows.length > 0;
    deleteSelect.innerHTML = nextRows
      .map((row) => `<option value="${row.name}">${row.name}</option>`)
      .join('');
  };

  setRows(rows()); // sync empty-state/delete-select with the seeded data on first paint

  document.querySelector('#kit-new-project-open').addEventListener('click', (event) => {
    modal.open(event, event.currentTarget);
  });
  document.querySelector('#kit-new-project-cancel').addEventListener('click', () => modal.close());

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    setRows([...rows(), {
      name: fieldName.state.value,
      owner: fieldOwner.state.value,
      updated: 'Just now',
      status: fieldStatus.state.value,
    }]);
    fieldName.setAttribute('data-value', '');
    fieldOwner.setAttribute('data-value', '');
    fieldStatus.setAttribute('data-value', 'Active');
    modal.close();
    toasts.show('Project created.');
  });

  deleteConfirm.addEventListener('dv:confirm', () => {
    const name = deleteSelect.value;
    if (!name) return;
    setRows(rows().filter((row) => row.name !== name));
    toasts.show(`"${name}" removed.`);
  });
}
