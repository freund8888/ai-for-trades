# backend/main.py
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="AI for Trades API", version="v106.1")

ALLOWED_ORIGINS = [
    "https://ai-for-trades-frontend.onrender.com",
    "http://localhost:3000", "http://127.0.0.1:3000",
    "http://localhost:5500", "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,   # no cookies; simpler CORS
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    # If you see this change on the live URL, we know THIS file is running.
    return {
        "ok": True,
        "service": "ai-for-trades-api",
        "version": "v106.1",
        "deployed_at": datetime.utcnow().isoformat() + "Z",
        "allowed_origins": ALLOWED_ORIGINS,
    }

# --- simple working /estimate so the frontend can test POST without 500s ---
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
    labor_cost = payload.laborHours * payload.laborRate
    subtotal = labor_cost
    total = round(subtotal * (1 + payload.salesTaxPercent/100), 2)
    return {
        "ok": True,
        "summary": f"Labor: {payload.laborHours}h @ ${payload.laborRate}/h = ${labor_cost:.2f}\nTotal (est.): ${total:.2f}"
    }
