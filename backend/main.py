from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Any, Dict
from pydantic import BaseModel
from typing import Optional


app = FastAPI(title="AI for Trades API")

# Allow your live frontend to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # TEMP: open to all while testing
    allow_credentials=False,      # must be False when using "*"
    allow_methods=["*"],          # includes OPTIONS preflight
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

class EstimateRequest(BaseModel):
    inputs: Optional[Dict[str, Any]] = None

@app.post("/estimate")
async def estimate(req: EstimateRequest) -> Dict[str, Any]:
    return {
        "ok": True,
        "message": "Estimate endpoint reached successfully!",
        "received_payload": req.model_dump(),
    }

