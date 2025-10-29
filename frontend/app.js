// Simple, explicit frontend for HVAC Estimator
// Shows customer header (single line), job line, range, split, assumptions, disclaimer.

console.log("BUILD v3");

const API_BASE = "http://127.0.0.1:8000";

const form = document.getElementById("estForm");
const result = document.getElementById("result");

// Helpers
function currency(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function oneLine(str) {
  if (!str) return "";
  return String(str).replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
}

function renderEstimate(data){
  const { inputs, estimate, disclaimer } = data;

  // Numbers (coerce in case they are strings)
  const low = Number(estimate?.low_usd);
  const high = Number(estimate?.high_usd);
  const materials = Number(estimate?.materials_usd);
  const labor = Number(estimate?.labor_usd);
  const haveSplit = Number.isFinite(materials) && Number.isFinite(labor);

  // Customer single-line header
  const nameText  = oneLine(inputs?.customer_name);
  const addrText  = oneLine(inputs?.address);
  const phoneText = oneLine(inputs?.phone);

  const nameSpan  = nameText  ? `<span class="cust-piece">${nameText}</span>`  : "";
  const addrSpan  = addrText  ? `<span class="cust-piece">${addrText}</span>`  : "";
  const phoneSpan = phoneText ? `<span class="cust-piece">${phoneText}</span>` : "";

  const custLine = (nameSpan || addrSpan || phoneSpan)
    ? `<div class="quote-customer">${nameSpan}${addrSpan}${phoneSpan}</div>`
    : "";

  // Job single-line
  const jobLine = [
    `${inputs.sqft} sqft`,
    (inputs.system_type || "").replace("_"," "),
    inputs.zip
  ].filter(Boolean).join(" · ");

  // Assumptions (filter the 55/45 note from display only)
  const assumptions = (estimate.assumptions || [])
    .filter(a => !a.toLowerCase().includes("55/45"));

  result.classList.remove("hidden");
result.innerHTML = `
  <div class="quote-header">
    ${custLine}
    <div class="quote-job">${jobLine}</div>
  </div>

  <div class="quote-section">
    <div class="quote-row">
      <div class="quote-label">Range</div>
      <div class="quote-value">${currency(low)} – ${currency(high)}</div>
    </div>
    ${ haveSplit ? `
    <div class="quote-row">
      <div class="quote-label">Split</div>
      <div class="quote-value">Materials ${currency(materials)} · Labor ${currency(labor)}</div>
    </div>` : `` }
  </div>

  <div class="quote-section">
    <div class="quote-label">Assumptions</div>
    <ul class="quote-list">
      ${ assumptions.map(a => `<li>${a}</li>`).join("") }
    </ul>
  </div>

  <div class="quote-foot"><em>${disclaimer}</em></div>

  <div class="quote-actions">
    <button id="pdfBtn" type="button">Download PDF</button>
  </div>
`;


  // --- PDF Export handler ---
  const pdfBtn = document.getElementById("pdfBtn");
  if (pdfBtn) {
    pdfBtn.addEventListener("click", () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      let y = 15;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("HVAC Estimate", 14, y);
      y += 10;

      // Customer & Job
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      if (inputs.customer_name) doc.text(`Customer: ${inputs.customer_name}`, 14, y), y += 6;
      if (inputs.address) doc.text(`Address: ${inputs.address}`, 14, y), y += 6;
      if (inputs.phone) doc.text(`Phone: ${inputs.phone}`, 14, y), y += 6;
      y += 4;

      doc.text(`${inputs.sqft} sqft · ${(inputs.system_type || "").replace("_"," ")} · ${inputs.zip}`, 14, y);
      y += 8;

      // Price range
      doc.setFont("helvetica", "bold");
      doc.text(`Range: ${currency(estimate.low_usd)} – ${currency(estimate.high_usd)}`, 14, y);
      y += 6;

      if (estimate.materials_usd && estimate.labor_usd) {
        doc.setFont("helvetica", "normal");
        doc.text(`Materials: ${currency(estimate.materials_usd)}   Labor: ${currency(estimate.labor_usd)}`, 14, y);
        y += 6;
      }

      // Assumptions
      const assumptions = (estimate.assumptions || [])
        .filter(a => !a.toLowerCase().includes("55/45"));
      if (assumptions.length) {
        y += 6;
        doc.setFont("helvetica", "bold");
        doc.text("Assumptions:", 14, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        assumptions.forEach(a => {
          const split = doc.splitTextToSize(`• ${a}`, 180);
          doc.text(split, 14, y);
          y += split.length * 6;
        });
      }

      // Disclaimer
      y += 6;
      doc.setFont("helvetica", "italic");
      doc.text(disclaimer, 14, y);

      doc.save(`HVAC_Estimate_${inputs.zip || "Quote"}.pdf`);
    });
  }


}

// Submit handler
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  result.classList.add("hidden");
  result.textContent = "";

  const payload = {
    sqft: Number(document.getElementById("sqft").value),
    system_type: document.getElementById("system_type").value,
    home_age_years: Number(document.getElementById("home_age_years").value),
    zip: document.getElementById("zip").value,

    // Optional customer/job fields
    customer_name: document.getElementById("customer_name").value || null,
    address: document.getElementById("address").value || null,
    phone: document.getElementById("phone").value || null,
    notes: document.getElementById("notes").value || null
  };

  try {
const resp = await fetch(`${API_BASE}/estimate`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload)
});

    if (!resp.ok) throw new Error(`Server error ${resp.status}`);

    const data = await resp.json();
    console.log("ESTIMATE RESPONSE", data);

    renderEstimate(data);
  } catch (err) {
    result.classList.remove("hidden");
    result.innerHTML = `<strong>Error:</strong> ${err.message}`;
  }
});
