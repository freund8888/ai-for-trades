# backend/main.py  (v106.2)
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI for Trades API", version="v106.2")

ALLOWED_ORIGINS = [
    "https://ai-for-trades-frontend.onrender.com",
    "http://localhost:3000", "http://127.0.0.1:3000",
    "http://localhost:5500", "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "ok": True,
        "service": "ai-for-trades-api",
        "version": "v106.2",
        "deployed_at": datetime.utcnow().isoformat() + "Z",
        "allowed_origins": ALLOWED_ORIGINS,
    }
