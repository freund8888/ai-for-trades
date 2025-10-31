# backend/main.py  (v106.3)
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI for Trades API", version="v106.3")

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
        "version": "v106.3",
        "deployed_at": datetime.utcnow().isoformat() + "Z",
        "allowed_origins": ALLOWED_ORIGINS,
    }

# simple /estimate so frontend POST works
from pydantic import BaseModel
from typing import List, Optional

class EstimateIn(BaseModel):
    trade: Optional[str] = ""
    title: Optional[str] = ""
    description: Optional[str] = ""
    laborHours: float = 0
    laborRate: float = 0
    materials: List[str] = []
    markupPercent: float = 0
    overheadPercent: float = 0
    profitPercent: float = 0
    salesTaxPercent: float = 0
    travelMiles: float = 0
    rush: bool = False
    location: Optional[str] = ""
    referenceId: Optional[str] = ""

@app.post("/estimate")
def estimate(payload: EstimateIn):
    labor = payload.laborHours * payload.laborRate
    subtotal = labor
    total = round(subtotal * (1 + payload.salesTaxPercent/100), 2)
    return {"ok": True, "summary": f"Labor ${labor:.2f} | Total ${total:.2f}"}
