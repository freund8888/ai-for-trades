// Read API base from runtime config, fallback to local dev
const API_BASE = "https://ai-for-trades.onrender.com";


async function callEstimate(input) {
  const res = await fetch(`${API_BASE}/estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || "Request failed"}`);
  }

  return res.json();
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("estimateForm");
  const inputEl = document.getElementById("input");
  const outEl = document.getElementById("output");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = inputEl.value.trim();
    if (!value) return;

    outEl.textContent = "Working…";

    try {
      const data = await callEstimate(value);
      outEl.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      outEl.textContent = err.message || String(err);
    }
  });
});