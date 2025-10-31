# backend/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional

app = FastAPI(title="AI for Trades API", version="v106")

# --- CORS (start permissive to verify; tighten later) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],              # ← after it works, replace with your frontend origin(s)
    allow_credentials=True,
    allow_methods=["*"],              # includes GET/POST/OPTIONS for preflight
    allow_headers=["*"],              # includes content-type, authorization, etc.
)

# --- Models ---
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

class EstimateOut(BaseModel):
    ok: bool = True
    referenceId: Optional[str] = ""
    summary: str
    breakdown: dict

# --- Routes ---
@app.get("/")
def root():
    return {"ok": True, "service": "ai-for-trades-api", "version": "v106"}

@app.post("/estimate", response_model=EstimateOut)
async def estimate(payload: EstimateIn, request: Request):
    # Basic calc (placeholder — replace with your real logic)
    labor_cost = payload.laborHours * payload.laborRate
    material_subtotal = 0.0  # you can enhance to parse material costs later
    markup = material_subtotal * (payload.markupPercent / 100.0)
    overhead = (labor_cost + material_subtotal) * (payload.overheadPercent / 100.0)
    profit = (labor_cost + material_subtotal + markup + overhead) * (payload.profitPercent / 100.0)
    subtotal = labor_cost + material_subtotal + markup + overhead + profit
    sales_tax = subtotal * (payload.salesTaxPercent / 100.0)
    travel_cost = 0.0  # add your per-mile logic if desired
    rush_fee = subtotal * 0.1 if payload.rush else 0.0
    total = round(subtotal + sales_tax + travel_cost + rush_fee, 2)

    summary_lines = [
        f"Trade: {payload.trade or '(n/a)'}",
        f"Title: {payload.title or '(n/a)'}",
        f"Labor: {payload.laborHours}h @ ${payload.laborRate}/h = ${labor_cost:.2f}",
        f"Materials: {', '.join(payload.materials) if payload.materials else '(none)'}",
        f"Overhead: {payload.overheadPercent}%",
        f"Profit: {payload.profitPercent}%",
        f"Sales Tax: {payload.salesTaxPercent}%",
        f"Rush: {'Yes' if payload.rush else 'No'}",
        f"Location: {payload.location or '(n/a)'}",
        f"Total (est.): ${total:.2f}",
    ]

    return EstimateOut(
        ok=True,
        referenceId=payload.referenceId or "",
        summary="\n".join(summary_lines),
        breakdown={
            "laborCost": round(labor_cost, 2),
            "materialSubtotal": round(material_subtotal, 2),
            "markup": round(markup, 2),
            "overhead": round(overhead, 2),
            "profit": round(profit, 2),
            "subtotal": round(subtotal, 2),
            "salesTax": round(sales_tax, 2),
            "travelCost": round(travel_cost, 2),
            "rushFee": round(rush_fee, 2),
            "total": total,
        },
    )
