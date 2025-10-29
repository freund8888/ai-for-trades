 1 from fastapi import FastAPI
 2 from fastapi.middleware.cors import CORSMiddleware
 3 import os
 4
 5 FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
 6
 7 app = FastAPI(title="AI for Trades Backend")
 8
 9 app.add_middleware(
10     CORSMiddleware,
11     allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"],
12     allow_credentials=True,
13     allow_methods=["*"],
14     allow_headers=["*"],
15 )
16
17 @app.get("/health")
18 def health():
19     return {"ok": True}
20
21 @app.post("/estimate")
22 def estimate(payload: dict):
23     # TODO: Replace this with your real logic
24     user_input = payload.get("input", "")
25     return {"received": user_input, "estimate": 42}