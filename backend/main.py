# backend/main.py (Flask)
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": [
    "https://ai-for-trades-frontend.onrender.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
]}})
# If you need credentials: CORS(app, supports_credentials=True, ...)

@app.route("/", methods=["GET"])
def root():
    return jsonify(ok=True, service="ai-for-trades-api"))

# keep your /estimate route as-is
