from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import websockets

app = FastAPI()

# إعداد CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
API_KEY = os.getenv("API_KEY", "WT3I1S4AXdekRj1qHZDD9TyD8Fx5tQjC")
  # ← ضع مفتاح API من polygon.io
SYMBOLS = ["AAPL", "MSFT", "GOOG", "TSLA", "AMZN"]  # أسهم مؤثرة
async def polygon_trade_stream(websocket: WebSocket):
    uri = "wss://socket.polygon.io/stocks"
    async with websockets.connect(uri) as polygon_ws:
        await polygon_ws.send(json.dumps({"action": "auth", "params": API_KEY}))
      await polygon_ws.send(json.dumps({
    "action": "subscribe",
    "params": ",".join([f"T.{symbol}" for symbol in SYMBOLS])
}))
        MIN_VALUE = 100 # ← أقل قيمة صفقة (10 دولار مثلاً)

        while True:
            message = await polygon_ws.recv()
            data = json.loads(message)
            if isinstance(data, list):
    for item in data:
        if item["ev"] == "T":  # "T" تعني trade
            price = item.get("p", 0)
            volume = item.get("s", 0)
            value = price * volume

            if value >= MIN_VALUE:
                trade = {
                    "symbol": item.get("sym", ""),
                    "price": price,
                    "volume": volume,
                    "timestamp": item.get("t", ""),
                    "side": "Buy" if item.get("c", [""])[0] == "B" else "Sell"
                }
                await websocket.send_json(trade)

@app.get("/")
def read_root():
    return {"message": "✅ WebSocket server is running. Connect to /ws/trades"}

@app.websocket("/ws/trades")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        await polygon_trade_stream(websocket)
    except Exception as e:
        await websocket.close()
