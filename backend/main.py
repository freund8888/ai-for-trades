from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Any, Dict

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

@app.post("/estimate")
async def estimate(request: Request) -> Dict[str, Any]:
    """
    Test endpoint to confirm backend is reachable and POST body works.
    """
    payload = await request.json()
    return {
        "ok": True,
        "message": "Estimate endpoint reached successfully!",
        "received_payload": payload
    }
