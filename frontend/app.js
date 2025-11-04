// AI for Trades — app.js v106.10e
// Adds Trade + job meta fields to payload, stabilizes UI, and handles empty responses gracefully.

(function () {
  const $ = (s, r = document) => r.querySelector(s);

  // ---- State ----
  const state = {
    inflight: false,
    apiUrl: 'https://ai-for-trades-api.onrender.com/estimate', // live backend
  };

  // ---- Field maps ----
  const CUSTOMER_FIELDS = ['firstName','lastName','phone','email','address','zip'];
  const JOB_FIELDS = {
    trade:        '#trade',
    urgency:      '#urgency',
    sqft:         '#sqft',
    rooms:        '#rooms',
    difficulty:   '#difficulty',
    description:  '#jobDescription',
    laborHours:   '#laborHours',
    laborRate:    '#laborRate',
    materialsBudget: '#materialsBudget',
  };

  function val(sel) {
    const el = typeof sel === 'string' ? $(sel) : sel;
    if (!el) return '';
    const v = (el.value ?? el.textContent ?? '').toString().trim();
    return v;
  }

  function getInput(idOrName) {
    return document.getElementById(idOrName) || document.querySelector(`[name="${idOrName}"]`);
  }

  // ---- Customer preview/card ----
  function readCustomer() {
    const v = (k) => {
      const el = getInput(k);
      return (el?.value ?? el?.textContent ?? '').trim();
    };
    return {
      firstName: v('firstName'),
      lastName:  v('lastName'),
      phone:     v('phone'),
      email:     v('email'),
      address:   v('address'),
      zip:       v('zip'),
    };
  }

  function isEmptyCustomer(c) {
    return !(c.firstName || c.lastName || c.phone || c.email || c.address || c.zip);
  }

  function renderCustomerCard(cust) {
    const card = $('#customerCard');
    if (!card) return;
    if (!cust || isEmptyCustomer(cust)) { card.hidden = true; return; }

    const safe = (v) => (v && v.length ? v : '—');
    const fullName = `${cust.firstName ?? ''} ${cust.lastName ?? ''}`.trim() || 'Customer';

    const set = (id, text) => { const el = $('#' + id, card); if (el) el.textContent = text; };
    set('custName', fullName);
    set('custPhone', safe(cust.phone));
    set('custEmail', safe(cust.email));
    set('custAddress', safe([cust.address, cust.zip].filter(Boolean).join(', ')));

    card.hidden = false;
  }

  function bindLiveCustomerPreview() {
    renderCustomerCard(readCustomer());
    CUSTOMER_FIELDS.forEach((k) => {
      const el = getInput(k);
      if (!el) return;
      const h = () => renderCustomerCard(readCustomer());
      el.addEventListener('input', h);
      el.addEventListener('change', h);
    });
    const form = $('#estimateForm');
    if (form) {
      form.addEventListener('reset', () => setTimeout(() => renderCustomerCard(readCustomer()), 0));
    }
  }

  // ---- Inline error ----
  function showInlineError(msg) {
    const el = $('#inlineError');
    if (!el) return console.warn('[aft] inlineError container missing');
    el.textContent = msg || 'An error occurred.';
    el.hidden = false;
    setTimeout(() => { if (el) el.hidden = true; }, 5000);
  }

  // ---- Gather payload ----
  function gatherPayload() {
    const customer = readCustomer();
    const job = {
      trade: val(JOB_FIELDS.trade),
      urgency: val(JOB_FIELDS.urgency) || 'Normal',
      sqft: parseNumber(val(JOB_FIELDS.sqft)),
      rooms: parseNumber(val(JOB_FIELDS.rooms)),
      difficulty: val(JOB_FIELDS.difficulty) || 'Standard',
      description: val(JOB_FIELDS.description),
      labor: {
        hours: parseNumber(val(JOB_FIELDS.laborHours)),
        rate:  parseNumber(val(JOB_FIELDS.laborRate)),
      },
      materials: {
        budget: parseNumber(val(JOB_FIELDS.materialsBudget)),
      },
      // include a simple derived flag the backend could use
      rushFeeEligible: ['Rush','Emergency'].includes(val(JOB_FIELDS.urgency)),
    };

    return { customer, job, client: { appVersion: 'v106.10e' } };
  }

  function parseNumber(str) {
    if (!str) return null;
    const n = Number(str);
    return Number.isFinite(n) ? n : null;
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
        mirrorToOutput({ error: `HTTP ${res.status}`, payload, server: data });
        return;
      }

      // If backend returns enriched customer, keep card in sync
      if (data && data.customer) {
        renderCustomerCard(data.customer);
      }

      if (data == null || (typeof data === 'object' && Object.keys(data).length === 0)) {
        // Graceful handling for empty responses: show what we sent
        mirrorToOutput({ note: 'No estimate returned by server.', payload, server: data });
      } else {
        mirrorToOutput(data);
      }
    } catch (err) {
      console.error('network error:', err);
      showInlineError('Network error while requesting estimate.');
      mirrorToOutput({ error: 'Network error', detail: String(err), payload });
    } finally {
      const dt = Math.round(performance.now() - t0);
      console.log('durationMs:', dt);
      console.groupEnd();
      state.inflight = false;
      if (btn) btn.disabled = false;
    }
  }

  function mirrorToOutput(obj) {
    const out = $('#estimateOutput');
    if (out) out.value = JSON.stringify(obj, null, 2);
  }

  function bindEstimateActions() {
    const btn  = $('#estimateBtn');
    const form = $('#estimateForm');
    if (btn)  btn.addEventListener('click', (e) => { e.preventDefault(); doEstimate(); });
    if (form) form.addEventListener('submit', (e) => { e.preventDefault(); doEstimate(); });
  }

  // ---- Init ----
  function init() {
    bindLiveCustomerPreview();
    bindEstimateActions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  // Debug
  window.__aft = { gatherPayload, doEstimate };
})();
