from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import asyncio
import json
import websockets
import os

app = FastAPI()

# إعداد CORS للسماح بالوصول من أي واجهة أمامية
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # يمكنك تخصيصه لاحقًا لمجال موقعك فقط
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# مسار ترحيبي بدل 404
@app.get("/")
async def root():
    return {"message": "✅ WebSocket server for big trades is running. Connect to /ws/trades"}

# تقديم ملفات React المبنية (بعد تنفيذ npm run build)
app.mount("/", StaticFiles(directory="../frontend/build", html=True), name="frontend")

# إعدادات WebSocket
API_KEY = os.getenv("POLYGON_API_KEY", "WT3I1S4AXdekRj1qHZDD9TyD8Fx5tQjC")  # مفتاح API
SYMBOL = "AAPL"  # يمكنك تغييره أو جعله متغير ديناميكي

# الاتصال بـ Polygon.io عبر WebSocket وإعادة بث الصفقات للعملاء
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
                    "side": "Buy/Sell"  # مبدئيًا، تحتاج تحليل فعلي لتحديده
                }
                await websocket.send_json(trade)

# WebSocket endpoint
@app.websocket("/ws/trades")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        await polygon_trade_stream(websocket)
    except Exception as e:
        print(f"WebSocket connection closed: {e}")
        await websocket.close()
