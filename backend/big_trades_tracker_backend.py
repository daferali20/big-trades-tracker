from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import asyncio
import random
import datetime

app = FastAPI()

# السماح بالاتصالات من الواجهة الأمامية
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/trades")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        trade = {
            "symbol": random.choice(["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA"]),
            "price": round(random.uniform(100, 1000), 2),
            "volume": random.randint(1000, 100000),
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "side": random.choice(["Buy", "Sell"]),
        }
        await websocket.send_json(trade)
        await asyncio.sleep(2)  # إرسال كل صفقة كل ثانيتين