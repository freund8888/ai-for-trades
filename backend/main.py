from typing import Any, Dict
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Body

app = FastAPI(title="AI for Trades API")

# --- CORS Configuration ---
# TEMP: open to all origins while testing connectivity.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,   # must be False when using "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Health check endpoint ---
@app.get("/health")
def health():
    return {"ok": True}

# --- Estimate endpoint ---
@app.post("/estimate")
async def estimate(req: dict = Body(default={})):
    return {
        "ok": True,
        "message": "Estimate endpoint reached successfully!",
        "received_payload": req,
    }