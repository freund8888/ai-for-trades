from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# --- DIAGNOSTIC: print whether Render sees the env var at import time ---
print("DIAG: main.py imported.")
print("DIAG: OPENAI_API_KEY present?", bool(os.getenv("OPENAI_API_KEY")))

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app = FastAPI(title="AI for Trades Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/env-check")
def env_check():
    # --- DIAGNOSTIC: confirm at request time too (no secrets exposed) ---
    return {
        "has_OPENAI_KEY": bool(os.getenv("OPENAI_API_KEY")),
        "frontend_url": os.getenv("FRONTEND_URL", "")
    }

@app.post("/estimate")
def estimate(payload: dict):
    # Demo logic to prove the server runs; replace with real impl later
    user_input = payload.get("input", "")
    return {"received": user_input, "estimate": 42}