 1 from fastapi import FastAPI
 2 from fastapi.middleware.cors import CORSMiddleware
 3 import os
 4
 5 # --- DIAGNOSTIC: print whether Render sees the env var at import time ---
 6 print("DIAG: main.py imported.")
 7 print("DIAG: OPENAI_API_KEY present?", bool(os.getenv("OPENAI_API_KEY")))
 8
 9 FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
10
11 app = FastAPI(title="AI for Trades Backend")
12
13 app.add_middleware(
14     CORSMiddleware,
15     allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
16     allow_credentials=True,
17     allow_methods=["*"],
18     allow_headers=["*"],
19 )
20
21 @app.get("/health")
22 def health():
23     return {"ok": True}
24
25 @app.get("/env-check")
26 def env_check():
27     # --- DIAGNOSTIC: confirm at request time too (no secrets exposed) ---
28     return {
29         "has_OPENAI_KEY": bool(os.getenv("OPENAI_API_KEY")),
30         "frontend_url": os.getenv("FRONTEND_URL", "")
31     }
32
33 @app.post("/estimate")
34 def estimate(payload: dict):
35     # Demo logic to prove the server runs; replace with real impl later
36     user_input = payload.get("input", "")
37     return {"received": user_input, "estimate": 42}
