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
API_KEY = os.getenv("API_KEY")  # ← ضع مفتاح API من polygon.io
SYMBOL = "AAPL"  # ← يمكنك تغييره لأي سهم

async def polygon_trade_stream(websocket: WebSocket):
    uri = "wss://socket.polygon.io/stocks"
    async with websockets.connect(uri) as polygon_ws:
        await polygon_ws.send(json.dumps({"action": "auth", "params": API_KEY}))
        await polygon_ws.send(json.dumps({"action": "subscribe", "params": f"T.{SYMBOL}"}))

        while True:
            message = await polygon_ws.recv()
            data = json.loads(message)
            if isinstance(data, list) and len(data) > 0 and data[0]["ev"] == "T":
                trade = {
                    "symbol": data[0].get("sym", ""),
                    "price": data[0].get("p", 0),
                    "volume": data[0].get("s", 0),
                    "timestamp": data[0].get("t", ""),
                    "side": "Buy/Sell"
                }
                await websocket.send_json(trade)

@app.websocket("/ws/trades")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        await polygon_trade_stream(websocket)
    except Exception as e:
        await websocket.close()
