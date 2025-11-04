// AI for Trades — app.js v106.10d
// Stable customer card + estimate flow without touching your layout or stylesheet.

(function () {
  const $ = (s, r = document) => r.querySelector(s);

  // ---- State ----
  const state = {
    inflight: false,
    apiUrl: '/estimate', // adjust if you use an absolute backend URL
  };

  // ---- Customer helpers ----
  const FIELD_IDS = ['firstName', 'lastName', 'phone', 'email', 'address'];

  function getInput(idOrName) {
    return document.getElementById(idOrName) || document.querySelector(`[name="${idOrName}"]`);
  }

  function readCustomer() {
    const val = (k) => {
      const el = getInput(k);
      return (el?.value ?? el?.textContent ?? '').trim();
    };
    return {
      firstName: val('firstName'),
      lastName:  val('lastName'),
      phone:     val('phone'),
      email:     val('email'),
      address:   val('address'),
    };
  }

  function isEmptyCustomer(c) {
    return !(c.firstName || c.lastName || c.phone || c.email || c.address);
  }

  function ensureCustomerCard() {
    // Card is already in HTML with id="customerCard"
    return $('#customerCard');
  }

  function renderCustomerCard(cust) {
    const card = ensureCustomerCard();
    if (!card) return;

    if (!cust || isEmptyCustomer(cust)) {
      // hide via HTML 'hidden' attribute (no CSS class required)
      card.hidden = true;
      return;
    }

    const safe = (v) => (v && v.length ? v : '—');
    const name = `${cust.firstName ?? ''} ${cust.lastName ?? ''}`.trim() || 'Customer';

    const set = (id, text) => {
      const el = $('#' + id, card);
      if (el) el.textContent = text;
    };
    set('custName', name);
    set('custPhone', safe(cust.phone));
    set('custEmail', safe(cust.email));
    set('custAddress', safe(cust.address));

    card.hidden = false;
  }

  function bindLiveCustomerPreview() {
    // Initial render on load
    renderCustomerCard(readCustomer());

    // Live updates on user input
    FIELD_IDS.forEach((k) => {
      const el = getInput(k);
      if (!el) return;
      const h = () => renderCustomerCard(readCustomer());
      el.addEventListener('input', h);
      el.addEventListener('change', h);
    });

    // Ensure reset hides the card
    const form = $('#estimateForm');
    if (form) {
      form.addEventListener('reset', () => {
        // values clear after 'reset' event; defer read
        setTimeout(() => renderCustomerCard(readCustomer()), 0);
      });
    }
  }

  // ---- Inline error ----
  function showInlineError(msg) {
    const el = $('#inlineError');
    if (!el) return console.warn('[aft] inlineError container missing');
    el.textContent = msg || 'An error occurred.';
    el.hidden = false;
    // Auto-hide after 5s (optional)
    setTimeout(() => { if (el) el.hidden = true; }, 5000);
  }

  // ---- Payload gatherer ----
  function gatherPayload() {
    // Collect customer + basic job fields. Extend as needed for your estimator.
    const customer = readCustomer();
    const job = {
      description: ($('#jobDescription')?.value || '').trim(),
    };
    return { customer, job };
  }

  // ---- Estimate flow ----
  async function doEstimate() {
    if (state.inflight) return;

    const btn = $('#estimateBtn');
    state.inflight = true;
    if (btn) btn.disabled = true;

    const url = state.apiUrl;
    const payload = gatherPayload();

    console.groupCollapsed('[estimate] request');
    console.log('POST', url, payload);
    const t0 = performance.now();

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

      console.log('status:', res.status, res.statusText);
      console.log('response:', data);

      if (!res.ok) {
        showInlineError(`Estimate failed (${res.status}).`);
        return;
      }

      // If API returns enriched customer, sync the card
      if (data && data.customer) {
        renderCustomerCard(data.customer);
      }

      const out = $('#estimateOutput');
      if (out) {
        out.value = JSON.stringify(data, null, 2);
      }
    } catch (err) {
      console.error('network error:', err);
      showInlineError('Network error while requesting estimate.');
    } finally {
      const dt = Math.round(performance.now() - t0);
      console.log('durationMs:', dt);
      console.groupEnd();
      state.inflight = false;
      if (btn) btn.disabled = false;
    }
  }

  function bindEstimateActions() {
    const btn  = $('#estimateBtn');
    const form = $('#estimateForm');
    if (btn)  btn.addEventListener('click', (e) => { e.preventDefault(); doEstimate(); });
    if (form) form.addEventListener('submit', (e) => { e.preventDefault(); doEstimate(); });
  }

  // ---- Safe init ----
  function init() {
    bindLiveCustomerPreview();
    bindEstimateActions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  // Optional: expose for quick debugging
  window.__aft = { readCustomer, renderCustomerCard, doEstimate };
})();
