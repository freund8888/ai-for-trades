console.log("BUILD v1");

const API_BASE = "http://127.0.0.1:8000";

const form = document.getElementById("estForm");
const result = document.getElementById("result");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  result.classList.add("hidden");
  result.textContent = "";

  const payload = {
    sqft: Number(document.getElementById("sqft").value),
    system_type: document.getElementById("system_type").value,
    home_age_years: Number(document.getElementById("home_age_years").value),
    zip: document.getElementById("zip").value
  };

  try {
    const resp = await fetch(`${API_BASE}/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error(`Server error ${resp.status}`);
    const data = await resp.json();
    renderEstimate(data);
  } catch (err) {
    result.classList.remove("hidden");
    result.innerHTML = `<strong>Error:</strong> ${err.message}`;
  }
});


function currency(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString(undefined, { style: "currency", currency: "USD" });
}



function renderEstimate(data){
  const { inputs, estimate, disclaimer } = data;

  // Ensure number formatting works even if values come back as strings
  const materials = Number(estimate?.materials_usd);
  const labor = Number(estimate?.labor_usd);
  const haveSplit = Number.isFinite(materials) && Number.isFinite(labor);


  // --- New customer header rendering ---
  const nameSpan  = inputs?.customer_name ? `<span class="cust-piece">${inputs.customer_name}</span>` : "";
  const addrSpan  = inputs?.address ? `<span class="cust-piece">${inputs.address}</span>` : "";
  const phoneSpan = inputs?.phone ? `<span class="cust-piece">${inputs.phone}</span>` : "";

  const custLine = (nameSpan || addrSpan || phoneSpan)
    ? `<div class="quote-customer">${nameSpan}${addrSpan}${phoneSpan}</div>`
    : "";



  const jobLine = [
    `${inputs.sqft} sqft`,
    (inputs.system_type || "").replace("_"," "),
    inputs.zip
  ].filter(Boolean).join(" · ");

  result.classList.remove("hidden");
  result.innerHTML = `

<div class="quote-header">
  ${custLine}
  <div class="quote-job">${jobLine}</div>
</div>



    <div class="quote-section">
      <div class="quote-row">
        <div class="quote-label">Range</div>
        <div class="quote-value">${currency(estimate.low_usd)} – ${currency(estimate.high_usd)}</div>
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
        ${
          (estimate.assumptions || [])
            .filter(a => !a.toLowerCase().includes("55/45"))
            .map(a=>`<li>${a}</li>`).join("")
        }
      </ul>
    </div>

    <div class="quote-foot"><em>${disclaimer}</em></div>
  `;
}
