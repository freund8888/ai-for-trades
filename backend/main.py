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

@app.post("/estimate")
def estimate(payload: dict):
    # Demo logic to prove the server runs; replace with real impl later
    user_input = payload.get("input", "")
    return {"received": user_input, "estimate": 42}