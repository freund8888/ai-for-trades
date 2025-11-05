// AI for Trades — app.js v106.12
// Finalized prototype: live customer card, name header in results,
// robust estimate request, backend status dot, and PDF export.

(function () {
  const $ = (s, r=document) => r.querySelector(s);

  // -------- State
  const state = {
    inflight: false,
    apiUrl: 'https://ai-for-trades-api.onrender.com/estimate', // live backend
    healthUrl: 'https://ai-for-trades-api.onrender.com/',      // health JSON
  };

  // -------- Customer helpers
  const CUSTOMER_FIELDS = ['firstName','lastName','phone','email','address','zip'];

  function getInput(idOrName){
    return document.getElementById(idOrName) || document.querySelector(`[name="${idOrName}"]`);
  }
  function readCustomer(){
    const v = (k) => (getInput(k)?.value ?? '').trim();
    return {
      firstName: v('firstName'),
      lastName:  v('lastName'),
      phone:     v('phone'),
      email:     v('email'),
      address:   v('address'),
      zip:       v('zip'),
    };
  }
  function isEmptyCustomer(c){
    return !(c.firstName || c.lastName || c.phone || c.email || c.address || c.zip);
  }
  function renderCustomerCard(c){
    const card = $('#customerCard');
    if (!card) return;
    if (!c || isEmptyCustomer(c)) { card.hidden = true; setResultHeaderName('—'); return; }

    const safe = (v)=> (v && v.length ? v : '—');
    const fullName = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || 'Customer';

    const set = (id, text) => { const el = $('#'+id, card); if (el) el.textContent = text; };
    set('custName', fullName);
    set('custPhone', safe(c.phone));
    set('custEmail', safe(c.email));
    set('custAddress', safe([c.address, c.zip].filter(Boolean).join(', ')));

    setResultHeaderName(fullName);
    card.hidden = false;
  }
  function setResultHeaderName(name){
    const h = $('#custNameHeader'); if (h) h.textContent = `Customer: ${name}`;
  }
  function bindLiveCustomerPreview(){
    renderCustomerCard(readCustomer());
    CUSTOMER_FIELDS.forEach((k)=>{
      const el=getInput(k); if (!el) return;
      const h=()=>renderCustomerCard(readCustomer());
      el.addEventListener('input',h);
      el.addEventListener('change',h);
    });
    const form=$('#estimateForm');
    if (form) form.addEventListener('reset',()=>setTimeout(()=>renderCustomerCard(readCustomer()),0));
  }

  // -------- Inline error
  function showInlineError(msg){
    const el=$('#inlineError'); if (!el) return;
    el.textContent = msg || 'An error occurred.';
    el.hidden = false;
    setTimeout(()=>{ if (el) el.hidden = true; }, 6000);
  }

  // -------- Payload
  function parseNumber(str){ if (!str) return null; const n=Number(str); return Number.isFinite(n)?n:null; }
  function v(sel){ const el=$(sel); return (el?.value ?? '').toString().trim(); }
  function gatherPayload(){
    const c = readCustomer();
    const job = {
      trade: v('#trade'),
      urgency: v('#urgency') || 'Normal',
      sqft: parseNumber(v('#sqft')),
      rooms: parseNumber(v('#rooms')),
      difficulty: v('#difficulty') || 'Standard',
      description: v('#jobDescription'),
      labor: { hours: parseNumber(v('#laborHours')), rate: parseNumber(v('#laborRate')) },
      materials: { budget: parseNumber(v('#materialsBudget')) },
      rushFeeEligible: ['Rush','Emergency'].includes(v('#urgency'))
    };
    return { customer: c, job, client: { appVersion: 'v106.12' } };
  }

  // -------- Estimate flow
  async function doEstimate(){
    if (state.inflight) return;
    const btn=$('#estimateBtn'); state.inflight=true; if (btn) btn.disabled=true;

    const url=state.apiUrl;
    const payload=gatherPayload();

    console.groupCollapsed('[estimate] POST', url);
    console.log('payload:', payload);
    const t0=performance.now();

    try{
      const res = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        // NOTE: omit credentials by default to avoid CORS preflight failures unless your API uses cookies
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let data; try{ data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

      console.log('status:', res.status, res.statusText, 'response:', data);

      if (!res.ok){
        showInlineError(`Estimate failed (${res.status}).`);
        mirrorToOutput({ error:`HTTP ${res.status}`, payload, server:data });
        return;
      }

      if (data && data.customer) renderCustomerCard(data.customer);

      if (!data || (typeof data==='object' && Object.keys(data).length===0)){
        mirrorToOutput({ note:'No estimate returned by server.', payload, server:data });
      } else {
        mirrorToOutput(data);
      }
    } catch (err){
      console.error('network error:', err);
      showInlineError('Network error. Check API URL or CORS (see console).');
      mirrorToOutput({ error:'Network error', detail:String(err), payload });
    } finally{
      console.log('durationMs:', Math.round(performance.now()-t0));
      console.groupEnd();
      state.inflight=false; if (btn) btn.disabled=false;
    }
  }
  function mirrorToOutput(obj){
    const out=$('#estimateOutput'); if (out) out.value = JSON.stringify(obj, null, 2);
  }

  function bindEstimateActions(){
    const btn=$('#estimateBtn'); const form=$('#estimateForm');
    if (btn)  btn.addEventListener('click', (e)=>{ e.preventDefault(); doEstimate(); });
    if (form) form.addEventListener('submit',(e)=>{ e.preventDefault(); doEstimate(); });
  }

  // -------- PDF Export (client-side print)
  function exportPdf(){
    try{
      const data = $('#estimateOutput')?.value || '';
      const name = $('#custNameHeader')?.textContent?.replace('Customer: ','') || 'Customer';
      const ts = new Date().toLocaleString();

      const win = window.open('', '_blank');
      if (!win) return showInlineError('Popup blocked. Allow popups to export PDF.');
      win.document.write(`
        <html><head><title>Estimate - ${name}</title>
        <style>
          body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;padding:24px;color:#111}
          h1{margin:0 0 6px;font-size:18px}
          .muted{color:#666;margin:0 0 18px}
          pre{white-space:pre-wrap;word-wrap:break-word;border:1px solid #ccc;border-radius:8px;padding:12px;background:#f7f7f9}
        </style></head>
        <body>
          <h1>Estimate — ${name}</h1>
          <div class="muted">${ts}</div>
          <pre>${escapeHtml(data || 'No data')}</pre>
          <script>window.print();</script>
        </body></html>
      `);
      win.document.close();
    } catch(e){
      console.error('pdf export failed', e);
      showInlineError('Could not generate PDF.');
    }
  }
  function escapeHtml(s){return s.replace(/[&<>]/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;' }[c]));}
  function bindPdf(){
    const btn=$('#pdfBtn'); if (btn) btn.addEventListener('click', exportPdf);
  }

  // -------- Status dot (backend health)
  async function checkHealth(){
    const dot = $('#statusDot'); if (!dot) return;
    try{
      const res = await fetch(state.healthUrl, { method:'GET', mode:'cors' });
      if (!res.ok) { dot.classList.add('warn'); dot.title = `Backend health HTTP ${res.status}`; return; }
      const txt = await res.text();
      dot.classList.add('ok');
      dot.title = 'Backend reachable';
      try{
        const j = JSON.parse(txt);
        $('#resultMeta').textContent = j?.version ? `API ${j.version}` : '';
      }catch{ /* ignore */ }
    }catch(e){
      dot.classList.add('err'); dot.title = 'Backend unreachable';
    }
  }

  // -------- Init
  function init(){
    bindLiveCustomerPreview();
    bindEstimateActions();
    bindPdf();
    checkHealth();
  }
  if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init, {once:true}); }
  else { init(); }

  // Debug
  window.__aft = { gatherPayload, doEstimate };
})();
