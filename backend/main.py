from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

ALLOWED_ORIGINS = [
    "https://ai-for-trades-frontend.onrender.com",  # your live frontend
    "http://localhost:5173",                        # keep for local dev (optional)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],   # ensures OPTIONS preflight is handled
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

from typing import Any, Dict
from fastapi import Request

@app.post("/estimate")
async def estimate(request: Request) -> Dict[str, Any]:
    # Read JSON body (ignore content for now)
    try:
        payload = await request.json()
    except Exception:
        payload = {}

    # Return a simple, known-good response
    return {
        "ok": True,
        "estimate": 1234.56,
        "inputs_echo": payload.get("inputs", {})
    }
