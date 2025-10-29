 1 // Read API base from runtime config, fallback to local dev
 2 const API_BASE =
 3   (window.ENV && window.ENV.API_BASE) ? window.ENV.API_BASE : "http://localhost:8000";
 4
 5 async function callEstimate(input) {
 6   const res = await fetch(`${API_BASE}/estimate`, {
 7     method: "POST",
 8     headers: { "Content-Type": "application/json" },
 9     body: JSON.stringify({ input })
10   });
11   if (!res.ok) {
12     const text = await res.text().catch(() => "");
13     throw new Error(`API ${res.status}: ${text || "Request failed"}`);
14   }
15   return res.json();
16 }
17
18 document.addEventListener("DOMContentLoaded", () => {
19   const form = document.getElementById("estimateForm");
20   const inputEl = document.getElementById("input");
21   const outEl = document.getElementById("output");
22
23   form.addEventListener("submit", async (e) => {
24     e.preventDefault();
25     const value = inputEl.value.trim();
26     if (!value) return;
27     outEl.textContent = "Working…";
28     try {
29       const data = await callEstimate(value);
30       outEl.textContent = JSON.stringify(data, null, 2);
31     } catch (err) {
32       outEl.textContent = err.message || String(err);
33     }
34   });
35 });