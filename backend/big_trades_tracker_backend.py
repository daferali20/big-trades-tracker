# big_trades_tracker_backend.py
# FastAPI backend for tracking large trades on key index stocks

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import asyncio
import httpx
from datetime import datetime

app = FastAPI()

# Allow frontend (e.g., React/Next.js) to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== Configuration =====
API_KEY = "WT3I1S4AXdekRj1qHZDD9TyD8Fx5tQjCY"
WATCHED_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "META"]  # Example: Top S&P 500 stocks
LARGE_TRADE_THRESHOLD = 100  # in dollars (e.g., $100K)

# ===== Helper function to fetch live trades (Mocked here) =====
async def fetch_live_trades(symbol: str):
    # This should call a real API (like Polygon.io or IEX) that supports time & sales
    # For now, we'll mock the data
    now = datetime.utcnow().isoformat()
    return [{
        "symbol": symbol,
        "price": 189.25,
        "volume": 6000,
        "side": "buy",  # or "sell"
        "timestamp": now
    }]

# ===== WebSocket for real-time data to frontend =====
@app.websocket("/ws/trades")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            results = []
            for symbol in WATCHED_SYMBOLS:
                trades = await fetch_live_trades(symbol)
                for trade in trades:
                    trade_value = trade["price"] * trade["volume"]
                    if trade_value >= LARGE_TRADE_THRESHOLD:
                        results.append(trade)

            await websocket.send_json(results)
            await asyncio.sleep(2)  # Delay for polling API or streaming source
    except Exception as e:
        print(f"WebSocket closed: {e}")
        await websocket.close()

# ===== REST endpoint for health check =====
@app.get("/ping")
def ping():
    return {"status": "ok"}
