from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import random
import time
from stock_stats import get_stock_stats  # ← تأكد من أن هذا الملف موجود في نفس المجلد

app = FastAPI()

# ✅ إعداد CORS للسماح للتطبيق الأمامي بالوصول
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # أو ضع ["http://localhost:3001"] لتقييده
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "✅ Mock trades WebSocket server is running. Connect to /ws/mock-trades"}

# ✅ بث الصفقات الوهمية عبر WebSocket
async def mock_trade_stream(websocket: WebSocket):
    symbols = ["AAPL", "TSLA", "GOOGL", "MSFT", "AMZN"]
    sides = ["Buy", "Sell"]
    await websocket.accept()
    try:
        while True:
            trade = {
                "symbol": random.choice(symbols),
                "price": round(random.uniform(100, 1500), 2),
                "volume": random.randint(1, 1000),
                "timestamp": int(time.time() * 1000),  # توقيت بالمللي ثانية
                "side": random.choice(sides)
            }
            await websocket.send_json(trade)
            await asyncio.sleep(1)
    except Exception as e:
        print("WebSocket disconnected:", e)
        await websocket.close()

# ✅ WebSocket Endpoint
@app.websocket("/ws/mock-trades")
async def websocket_endpoint(websocket: WebSocket):
    await mock_trade_stream(websocket)

# ✅ Endpoint لتحليل السهم بناءً على رمزه
@app.get("/stock-info/{symbol}")
def stock_info(symbol: str):
    return get_stock_stats(symbol)
