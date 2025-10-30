from typing import Any, Dict, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="AI for Trades API")

# TEMP: open CORS while we verify end-to-end
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,   # must be False when using "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

class EstimateRequest(BaseModel):
    inputs: Optional[Dict[str, Any]] = None

@app.get("/health")
def health():
    return {"ok": True}

from fastapi import Body

@app.post("/estimate")
def estimate(req: dict = Body(default={})):
    return {
        "ok": True,
        "message": "Estimate endpoint reached successfully!",
        "received_payload": req,
    }