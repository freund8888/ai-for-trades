// AI for Trades — minimal app.js v106
(function () {
  const $ = (s) => document.querySelector(s);

  // Elements (all exist in the v105+ index.html)
  const pingBtn       = $('#pingBtn');
  const statusDot     = $('#statusIcon');
  const statusText    = $('#statusText');
  const backendBaseEl = $('#backendBase');
  const endpointPathEl= $('#endpointPath');
  const endpointDisplay = $('#endpointDisplay');
  const form          = $('#estimateForm');
  const quotePreview  = $('#quotePreview');
  const jsonOutput    = $('#jsonOutput');
  const toggleViewBtn = $('#toggleViewBtn');
  const resetFormBtn  = $('#resetFormBtn');
  const copyJsonBtn   = $('#copyJsonBtn');
  const exportPdfBtn  = $('#exportPdfBtn');

  function setStatus(kind, text) {
    statusDot.classList.remove('status-idle','status-ok','status-error');
    statusDot.classList.add(kind);
    statusText.textContent = text;
  }

  function getBase() {
    const base = (backendBaseEl?.value || '').trim().replace(/\/+$/,'');
    return base || '';
  }
  function getPath() {
    const path = (endpointPathEl?.value || '/estimate').trim();
    return path.startsWith('/') ? path : '/' + path;
  }
  function updateEndpointDisplay() {
    if (endpointDisplay) endpointDisplay.textContent = getBase() + getPath();
  }
  updateEndpointDisplay();

  // --- Ping: proves JS is running + backend is reachable over the network.
  // We treat ANY HTTP response (200–499) as "reachable"; only network/CORS failure == error.
  async function handlePing() {
    const url = getBase() || '';
    if (!url) {
      setStatus('status-error', 'Set Backend Base URL first.');
      return;
    }
    setStatus('status-idle', 'Pinging…');
    try {
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      if (res.ok) {
        setStatus('status-ok', `Ping OK (${res.status})`);
      } else {
        // 404 on "/" is expected for API-only backends; still proves reachability.
        setStatus('status-ok', `Backend reachable (${res.status})`);
      }
    } catch (err) {
      setStatus('status-error', 'Network/CORS error — check backend URL and CORS.');
      console.error('Ping error:', err);
    }
  }

  // --- Simple estimate submit (POST /estimate). Safe/no-crash preview only.
  async function handleEstimateSubmit(e) {
    e?.preventDefault?.();
    const base = getBase();
    const path = getPath();
    updateEndpointDisplay();
    if (!base) {
      setStatus('status-error', 'Set Backend Base URL.');
      return;
    }
    const url = base + path;

    // Collect minimal payload
    const data = {
      trade: $('#tradeType')?.value || '',
      title: $('#jobTitle')?.value || '',
      description: $('#jobDescription')?.value || '',
      laborHours: Number($('#laborHours')?.value || 0),
      laborRate: Number($('#laborRate')?.value || 0),
      materials: ($('#materials')?.value || '').split(',').map(s => s.trim()).filter(Boolean),
      markupPercent: Number($('#markupPercent')?.value || 0),
      overheadPercent: Number($('#overheadPercent')?.value || 0),
      profitPercent: Number($('#profitPercent')?.value || 0),
      salesTaxPercent: Number($('#salesTaxPercent')?.value || 0),
      travelMiles: Number($('#travelMiles')?.value || 0),
      rush: ($('#rushToggle')?.value || 'no') === 'yes',
      location: $('#location')?.value || '',
      referenceId: $('#referenceId')?.value || ''
    };

    setStatus('status-idle', 'Submitting estimate…');
    $('#lastRequest') && ($('#lastRequest').textContent = JSON.stringify({ url, data }, null, 2));

    try {
      const res = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const text = await res.text().catch(() => '');
      let json;
      try { json = JSON.parse(text); } catch { /* not JSON */ }

      $('#lastResponse') && ($('#lastResponse').textContent = text || `(empty, status ${res.status})`);

      if (res.ok && json) {
        setStatus('status-ok', 'Estimate OK');
        // Pretty summary
        quotePreview.textContent =
          `Estimate Summary\n\n` +
          `Trade: ${data.trade}\nTitle: ${data.title}\n` +
          `Labor: ${data.laborHours}h @ $${data.laborRate}/h\n` +
          `Materials: ${data.materials.join(', ') || '(none)'}\n` +
          `Location: ${data.location || '(n/a)'}\n\n` +
          (json.summary || JSON.stringify(json, null, 2));
        jsonOutput.textContent = JSON.stringify(json, null, 2);
      } else {
        // Still show network success with status code
        setStatus('status-error', `Estimate request failed (${res.status})`);
        quotePreview.textContent = `Request to ${url} failed with status ${res.status}.\nBody:\n${text}`;
        jsonOutput.textContent = text;
      }
    } catch (err) {
      setStatus('status-error', 'Network/CORS error on /estimate.');
      quotePreview.textContent = `Network/CORS error: ${err?.message || err}`;
      console.error(err);
    }
  }

  function handleToggleView() {
    const showingSummary = !jsonOutput.hasAttribute('hidden');
    if (showingSummary) {
      jsonOutput.setAttribute('hidden', '');
      quotePreview.removeAttribute('hidden');
      toggleViewBtn?.setAttribute('aria-pressed', 'false');
    } else {
      quotePreview.setAttribute('hidden', '');
      jsonOutput.removeAttribute('hidden');
      toggleViewBtn?.setAttribute('aria-pressed', 'true');
    }
  }

  function handleResetForm() {
    form?.reset?.();
    setStatus('status-idle', 'Ready.');
    quotePreview.textContent = 'Fill in the form and click Generate Estimate to preview the quote.';
    jsonOutput.textContent = '';
    jsonOutput.setAttribute('hidden', '');
    quotePreview.removeAttribute('hidden');
    updateEndpointDisplay();
  }

  function handleCopyJson() {
    const txt = jsonOutput.textContent || '';
    if (!txt) { setStatus('status-error','No JSON to copy.'); return; }
    navigator.clipboard.writeText(txt).then(
      () => setStatus('status-ok', 'JSON copied.'),
      () => setStatus('status-error', 'Copy failed.')
    );
  }
// ----- Customer block → Estimate Preview (non-breaking) -----
(function () {
  const form = document.getElementById('estimateForm');
  const previewRoot = document.getElementById('quotePreview');
  if (!form || !previewRoot) return;

  function val(id) {
    const el = document.getElementById(id);
    return el && typeof el.value === 'string' ? el.value.trim() : '';
  }

  function upsertCustomerPreview() {
    if (!previewRoot) return;

    // Collect values
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

    // If nothing is filled, hide the block
    const hasAny =
      Object.values(data).some(x => x && x.length > 0);

    let block = document.getElementById('custPreview');
    if (!hasAny) {
      if (block) block.remove();
      return;
    }

    // Create block if needed
    if (!block) {
      block = document.createElement('div');
      block.id = 'custPreview';
      block.className = 'cust-preview';
      // Put customer info at the very top of the preview
      previewRoot.prepend(block);
    }

    // Compose address line smartly
    const cityStateZip = [data.city, data.state].filter(Boolean).join(', ') + (data.zip ? ` ${data.zip}` : '');
    const addressLines = [data.addr1, data.addr2, cityStateZip].filter(s => s && s.trim().length > 0);

    // Build rows only for non-empty fields
    const rows = [];
    function row(label, value) {
      if (!value) return;
      rows.push(`<div class="kv"><label>${label}</label><strong>${value}</strong></div>`);
    }

    row('Name', data.name);
    row('Company', data.company);
    row('Phone', data.phone);
    row('Email', data.email);
    if (addressLines.length) row('Address', addressLines.join('<br>'));
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

  // Hook after your existing submit logic runs; DOM update runs next tick
  form.addEventListener('submit', function () {
    setTimeout(upsertCustomerPreview, 0);
  });
})();

  function handleExportPdf() {
    // Let the browser's print-to-PDF handle it
    window.print();
  }

  // Wire events (guard in case elements are missing)
  pingBtn      && pingBtn.addEventListener('click', handlePing);
  form         && form.addEventListener('submit', handleEstimateSubmit);
  toggleViewBtn&& toggleViewBtn.addEventListener('click', handleToggleView);
  resetFormBtn && resetFormBtn.addEventListener('click', handleResetForm);
  copyJsonBtn  && copyJsonBtn.addEventListener('click', handleCopyJson);
  exportPdfBtn && exportPdfBtn.addEventListener('click', handleExportPdf);

  // Initial state
  setStatus('status-idle', 'Ready.');
})();
