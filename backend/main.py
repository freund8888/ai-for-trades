from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal, Optional
import os, json
from dotenv import load_dotenv
from openai import OpenAI
from fastapi import FastAPI, HTTPException, Header, Depends


#added

import csv, datetime

CSV_PATH = os.path.join(os.path.dirname(__file__), "estimates.csv")

def log_estimate(payload_dict: dict, result_dict: dict) -> None:
    """Append a row to estimates.csv with inputs and the returned range."""
    # Optional: trace to console so you can see it happen
    print(f"Logging estimate for {payload_dict.get('zip')} -> {CSV_PATH}")

    file_exists = os.path.exists(CSV_PATH)
    with open(CSV_PATH, mode="a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "timestamp",
                "sqft",
                "system_type",
                "home_age_years",
                "zip",
                "low_usd",
                "high_usd",
                "assumptions",
                "notes",
                "customer_name",
                "address",
                "phone",
                "notes",

            ],
        )
        if not file_exists:
            writer.writeheader()

        writer.writerow({
            "timestamp": datetime.datetime.now().isoformat(timespec="seconds"),
            "sqft": payload_dict.get("sqft"),
            "system_type": payload_dict.get("system_type"),
            "home_age_years": payload_dict.get("home_age_years"),
            "zip": payload_dict.get("zip"),
            "low_usd": (result_dict.get("estimate", {}) or {}).get("low_usd"),
            "high_usd": (result_dict.get("estimate", {}) or {}).get("high_usd"),
            "assumptions": "; ".join((result_dict.get("estimate", {}) or {}).get("assumptions", [])),
            "notes": (result_dict.get("estimate", {}) or {}).get("notes", ""),
            "customer_name": payload_dict.get("customer_name", ""),
            "address": payload_dict.get("address", ""),
            "phone": payload_dict.get("phone", ""),
            "notes": payload_dict.get("notes", ""),

        })





# Load .env settings
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL = os.getenv("MODEL", "gpt-4o-mini")
REGION_MULTIPLIER = float(os.getenv("REGION_MULTIPLIER", "1.0"))
ALLOWED_ORIGINS = [o for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o]

API_SHARED_SECRET = os.getenv("API_SHARED_SECRET")


if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY not set (create a .env file).")

client = OpenAI(api_key=OPENAI_API_KEY)

# FastAPI app
app = FastAPI(title="AI for Trades – HVAC Estimator API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],  # tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input model (validates request body)
class EstimateIn(BaseModel):
    sqft: int = Field(ge=300, le=10000)
    system_type: Literal["central_ac", "heat_pump", "furnace", "mini_split"]
    home_age_years: int = Field(ge=0, le=150)
    zip: str = Field(min_length=5, max_length=10)

    # NEW (all optional)
    customer_name: Optional[str] = None
    address: Optional[str] = None     # street + city/state if you want
    phone: Optional[str] = None
    notes: Optional[str] = None

# Output model (helps catch mistakes)
class EstimateOut(BaseModel):
    category: str
    inputs: dict
    estimate: dict
    disclaimer: str

# --- API Key verification (simple shared secret) ---
from fastapi import Header, Depends

def verify_api_key(x_api_key: str = Header(None)):
    """Simple header check for shared secret."""
    if not API_SHARED_SECRET:
        return  # no secret set (dev mode)
    if x_api_key != API_SHARED_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized: invalid API key")

# Bring in the system prompt
from prompts import HVAC_SYSTEM_PROMPT

@app.get("/health")
def health():
    return {"ok": True, "model": MODEL}

@app.post("/estimate", response_model=EstimateOut, dependencies=[Depends(verify_api_key)])
def estimate(payload: EstimateIn):

    user_prompt = (
        f"sqft={payload.sqft}; system_type={payload.system_type}; "
        f"home_age_years={payload.home_age_years}; zip={payload.zip}.\n"
        f"REGION_MULTIPLIER={REGION_MULTIPLIER}."
    )
    try:
        resp = client.responses.create(
            model=MODEL,
            input=[
                {"role": "system", "content": HVAC_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
        )
        text = resp.output_text.strip()
        data = json.loads(text)

        # Server-enforce the multiplier (belt and suspenders)
        if "estimate" in data and isinstance(data["estimate"], dict):
            est = data["estimate"]

            # Scale required range endpoints
            lo = float(est.get("low_usd", 0))
            hi = float(est.get("high_usd", 0))
            est["low_usd"] = round(lo * REGION_MULTIPLIER, 2)
            est["high_usd"] = round(hi * REGION_MULTIPLIER, 2)

            # Scale materials/labor if present, else provide a safe fallback from midpoint
            mats = est.get("materials_usd")
            labor = est.get("labor_usd")
            if isinstance(mats, (int, float)) and isinstance(labor, (int, float)):
                est["materials_usd"] = round(float(mats) * REGION_MULTIPLIER, 2)
                est["labor_usd"] = round(float(labor) * REGION_MULTIPLIER, 2)
            else:
                # Fallback: derive a reasonable split from the midpoint (55% materials / 45% labor)
                midpoint = (est["low_usd"] + est["high_usd"]) / 2 if (est["low_usd"] and est["high_usd"]) else 0
                est["materials_usd"] = round(midpoint * 0.55, 2)
                est["labor_usd"] = round(midpoint * 0.45, 2)
                est.setdefault("assumptions", []).append(
                    "Materials/labor split derived server-side at 55/45 due to missing model fields."
                )

            data["estimate"] = est

        # Log to CSV and return
        log_estimate(payload.model_dump(), data)
        return data


    except json.JSONDecodeError:
         raise HTTPException(status_code=502, detail="Model did not return valid JSON.")
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))
