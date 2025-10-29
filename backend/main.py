from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()  # ← this line must come before the middleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # TEMP: open to all origins just to test
    allow_credentials=False,  # must be False when using "*"
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
