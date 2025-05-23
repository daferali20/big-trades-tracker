from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import websockets
import os

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# نقطة رئيسية (للتأكد أن الخادم يعمل)
@app.get("/")
def root():
    return {"message": "✅ WebSocket server for big trades is running. Connect to /ws/trades"}

API_KEY = os.getenv("API_KEY", "WT3I1S4AXdekRj1qHZDD9TyD8Fx5tQjC")  # مفتاح افتراضي للاختبار
SYMBOLS = ["AAPL", "MSFT", "GOOG", "TSLA", "AMZN"]  # أسهم مؤثرة

async def polygon_trade_stream(websocket: WebSocket):
    uri = "wss://socket.polygon.io/stocks"
    async with websockets.connect(uri) as polygon_ws:
        await polygon_ws.send(json.dumps({"action": "auth", "params": API_KEY}))
        await polygon_ws.send(json.dumps({
    "action": "subscribe",
    "params": ",".join([f"T.{symbol}" for symbol in SYMBOLS])
}))

        MIN_VALUE = 0  # ← أقل قيمة صفقة (10 دولار مثلاً)

        while True:
            message = await polygon_ws.recv()
            data = json.loads(message)
            if isinstance(data, list) and len(data) > 0 and data[0]["ev"] == "T":
                price = data[0].get("p", 0)
                volume = data[0].get("s", 0)
                value = price * volume

                if value >= MIN_VALUE:
                    trade = {
                        "symbol": data[0].get("sym", ""),
                        "price": price,
                        "volume": volume,
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
        print("❌ WebSocket Error:", e)
        await websocket.close()

