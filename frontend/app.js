// ============================================================
// AI for Trades - Job Estimator (Frontend Logic)
// v106.9 - Customer Preview resilient + explicitly refreshed after render
// ============================================================

// DOM READY UTIL ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const backendBaseInput = document.querySelector('[data-backend-base]');
  const endpointPathInput = document.querySelector('[data-endpoint-path]');
  const estimateForm = document.getElementById('estimateForm');
  const statusText = document.getElementById('statusText');
  const statusDot = document.getElementById('statusIcon');
  const jsonOutput = document.getElementById('jsonOutput');
  const quotePreview = document.getElementById('quotePreview');
  const copyJsonBtn = document.getElementById('copyJsonBtn');
  const exportPdfBtn = document.getElementById('exportPdfBtn');
  const toggleViewBtn = document.getElementById('toggleViewBtn');
  const resetFormBtn = document.getElementById('resetFormBtn');

  // Helper: Set status bar
  function setStatus(state, message) {
    if (statusText) statusText.textContent = message;
    if (statusDot) statusDot.className = `status-dot status-${state}`;
  }

  // Helper: Compose endpoint
  function getEndpoint() {
    const base = backendBaseInput ? backendBaseInput.value : '';
    const path = endpointPathInput ? endpointPathInput.value : '';
    return `${base}${path}`;
  }

  // Ping backend ------------------------------------------------------------
  const pingBtn = document.getElementById('pingBtn');
  if (pingBtn) {
    pingBtn.addEventListener('click', async () => {
      setStatus('pending', 'Pinging backend...');
      try {
        const url = getEndpoint().replace('/estimate', '/');
        const res = await fetch(url, { method: 'GET' });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        setStatus('ok', 'Backend reachable!');
      } catch (err) {
        setStatus('error', 'Ping failed.');
      }
    });
  }

  // Estimate form submission ------------------------------------------------
  if (estimateForm) {
    estimateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setStatus('pending', 'Generating estimate...');

      const formData = new FormData(estimateForm);
      const data = Object.fromEntries(formData.entries());

      try {
        const res = await fetch(getEndpoint(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();

        // Update JSON preview
        if (jsonOutput) jsonOutput.textContent = JSON.stringify(result, null, 2);

        // Update text preview
        if (quotePreview) {
          quotePreview.innerHTML = `<div class="summary-block">
            <p><strong>Estimate Summary</strong><br>
            Trade: ${data.tradeType || '-'}<br>
            Title: ${data.jobTitle || '-'}<br>
            Labor: ${data.laborHours || 0}h @ $${data.laborRate || 0}/h<br>
            Materials: ${data.materials || '-'}<br>
            Location: ${data.location || '-'}<br>
            <br>
            <strong>Total:</strong> ${result.total_formatted || '$0.00'}</p>
          </div>`;
        }

        // Explicitly refresh the customer preview AFTER we render the summary
        if (window.upsertCustomerPreview) {
          window.upsertCustomerPreview();
          setTimeout(window.upsertCustomerPreview, 50);
          setTimeout(window.upsertCustomerPreview, 200);
        }

        setStatus('ok', 'Estimate generated.');
      } catch (err) {
        setStatus('error', 'Failed to generate estimate.');
        if (quotePreview) quotePreview.innerHTML = `<p class='error'>${err.message}</p>`;
      }
    });
  }

  // Reset form --------------------------------------------------------------
  if (resetFormBtn) {
    resetFormBtn.addEventListener('click', () => {
      estimateForm.reset();
      if (quotePreview) {
        quotePreview.innerHTML = `<div class="placeholder">
          <p>Fill in the form and click <strong>Generate Estimate</strong> to preview the quote.</p>
        </div>`;
      }
      if (jsonOutput) jsonOutput.hidden = true;
      setStatus('idle', 'Ready.');
      // Clear customer preview on reset
      if (window.upsertCustomerPreview) window.upsertCustomerPreview();
    });
  }

  // Toggle JSON / Summary view ----------------------------------------------
  if (toggleViewBtn) {
    toggleViewBtn.addEventListener('click', () => {
      const showingSummary = toggleViewBtn.dataset.view === 'summary';
      toggleViewBtn.dataset.view = showingSummary ? 'json' : 'summary';
      toggleViewBtn.textContent = showingSummary ? 'JSON' : 'Summary';
      if (quotePreview) quotePreview.hidden = !showingSummary;
      if (jsonOutput) jsonOutput.hidden = showingSummary;
    });
  }

  // Copy JSON ---------------------------------------------------------------
  if (copyJsonBtn) {
    copyJsonBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(jsonOutput.textContent);
        setStatus('ok', 'JSON copied to clipboard');
      } catch {
        setStatus('error', 'Copy failed');
      }
    });
  }

  // Export PDF (placeholder) -------------------------------------------------
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', () => {
      window.print(); // Simple prototype method
    });
  }
});

// ============================================================================
// Customer block → Estimate Preview (resilient to re-renders)
// Exposes window.upsertCustomerPreview so main render can call it explicitly
// ============================================================================
(function () {
  const form = document.getElementById('estimateForm');
  const outputPane = document.getElementById('outputPane');
  if (!form || !outputPane) return;

  function getPreviewRoot() {
    return document.getElementById('quotePreview');
  }

  function ensureMount() {
    let mount = document.getElementById('customerPreviewMount');
    if (mount) return mount;
    const cardBody = outputPane.querySelector('.card-body');
    if (!cardBody) return null;
    mount = document.createElement('div');
    mount.id = 'customerPreviewMount';
    cardBody.insertBefore(mount, cardBody.firstChild);
    return mount;
  }

  function val(id) {
    const el = document.getElementById(id);
    return el && typeof el.value === 'string' ? el.value.trim() : '';
  }

  function _upsert() {
    const mount = ensureMount();
    const previewRoot = getPreviewRoot();
    if (!mount || !previewRoot) return;

    const data = {
      name: val('custName'),
      company: val('custCompany'),
      phone: val('custPhone'),
      email: val('custEmail'),
      addr1: val('custAddress1'),
      addr2: val('custAddress2'),
      city: val('custCity'),
      state: val('custState'),
      zip: val('custZip'),
      pref: val('prefContact'),
      start: val('targetStart'),
      notes: val('customerNotes')
    };

    const hasAny = Object.values(data).some(Boolean);
    let block = document.getElementById('custPreview');

    if (!hasAny) {
      if (block) block.remove();
      return;
    }

    if (!block) {
      block = document.createElement('div');
      block.id = 'custPreview';
      block.className = 'cust-preview';
      mount.innerHTML = '';
      mount.appendChild(block);
    }

    const cityState = [data.city, data.state].filter(Boolean).join(', ');
    const cityStateZip = cityState ? (data.zip ? `${cityState} ${data.zip}` : cityState) : (data.zip || '');

    const rows = [];
    const row = (label, value) => {
      if (!value) return;
      rows.push(`<div class="kv"><label>${label}</label><strong>${value}</strong></div>`);
    };

    row('Name', data.name);
    row('Company', data.company);
    row('Phone', data.phone);
    row('Email', data.email);

    const addressParts = [data.addr1, data.addr2, cityStateZip].filter(Boolean);
    if (addressParts.length) row('Address', addressParts.join('<br>'));

    row('Preferred Contact', data.pref);
    row('Target Start', data.start);
    row('Notes', data.notes);

    block.innerHTML = `
      <div class="cust-preview__head">Customer</div>
      <div class="cust-preview__body">
        ${rows.join('')}
      </div>
    `;
  }

  // Expose a callable so other code can force refresh after it paints
  window.upsertCustomerPreview = _upsert;

  // Run on submit (immediate + after renderer likely paints)
  form.addEventListener('submit', function () {
    _upsert();
    setTimeout(_upsert, 50);
    setTimeout(_upsert, 200);
  });

  // Observe the entire output pane for re-renders
  const mo = new MutationObserver(() => _upsert());
  mo.observe(outputPane, { childList: true, subtree: true });
})();
