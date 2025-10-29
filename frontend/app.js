// Backend API
const API_BASE = "https://ai-for-trades.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("estimateForm");
  const input = document.getElementById("input");
  const output = document.getElementById("output");
  const submitBtn = form.querySelector('button[type="submit"]');

  const setLoading = (isLoading) => {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "Estimating…" : "Estimate";
  };

  const show = (data) => {
    try {
      // Pretty-print JSON if it is JSON, otherwise show as text
      if (typeof data === "object") {
        output.textContent = JSON.stringify(data, null, 2);
      } else {
        output.textContent = String(data);
      }
    } catch (e) {
      output.textContent = String(data);
    }
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const prompt = (input.value || "").trim();
    if (!prompt) return;

    setLoading(true);
    output.textContent = "Working…";

    try {
      const res = await fetch(`${API_BASE}/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: prompt }) // <- backend expects { input: "..."}
      });

      // Handle non-200s cleanly
      if (!res.ok) {
        const text = await res.text();
        show({ error: `HTTP ${res.status}`, details: text });
        return;
        }

      // Try JSON first; fall back to text
      let data;
      const ct = res.headers.get("content-type") || "";
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