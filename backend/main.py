from fastapi import Request

@app.post("/estimate")
async def estimate(request: Request):
    try:
        payload = await request.json()
    except Exception:
        payload = {}

    return {
        "ok": True,
        "message": "Estimate endpoint reached successfully!",
        "received_payload": payload
    }