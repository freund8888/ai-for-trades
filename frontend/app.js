// --- Frontend: AI for Trades ---
// Connects to FastAPI backend at ai-for-trades-api.onrender.com

const API_BASE = "https://ai-for-trades-api.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("estimateForm");
  const input = document.getElementById("input");
  const output = document.getElementById("output");
  const submitBtn = form.querySelector('button[type="submit"]');

  // Toggle button state
  const setLoading = (isLoading) => {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "Estimating…" : "Estimate";
  };

  // Display response nicely
  const show = (data) => {
    try {
      if (typeof data === "object") {
        output.textContent = JSON.stringify(data, null, 2);
      } else {
        output.textContent = String(data);
      }
    } catch (e) {
      output.textContent = String(data);
    }
  };

  // Handle form submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const prompt = (input.value || "").trim();
    if (!prompt) return;

    setLoading(true);
    output.textContent = "Working…";

    try {
      // Build payload and call backend
      const payload = { input: prompt };

      const res = await fetch(`${API_BASE}/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        show({ error: `HTTP ${res.status}`, details: text });
        return;
      }

      const ct = res.headers.get("content-type") || "";
      let data;
      if (ct.includes("application/json")) {
        data = await res.json();
      } else {
        data = await res.text();
      }
      show(data);
    } catch (err) {
      show({ error: "Network error", details: String(err) });
    } finally {
      setLoading(false);
    }
  });
});
