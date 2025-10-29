from typing import Any, Dict
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI for Trades API")

# Allow your live frontend (and local dev) to call this API
ALLOWED_ORIGINS = [
    "https://ai-for-trades-frontend.onrender.com",  # LIVE frontend
    "http://localhost:5173",                        # Vite dev (optional)
    "http://127.0.0.1:5173",                        # Vite dev (optional)
]

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],     # TEMP: allow all origins
    allow_credentials=False, # must be False when using "*"
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}

@app.post("/estimate")
async def estimate(request: Request) -> Dict[str, Any]:
    # minimal working handler; swap in your real logic later
    try:
        payload = await request.json()
    except Exception:
        payload = {}

    return {
        "ok": True,
        "estimate": 1234.56,
        "inputs_echo": payload.get("inputs", payload),
    }
