from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional
import asyncio
import httpx
from datetime import datetime
import logging
from pydantic import BaseModel
import os
import json
import websockets  # ستحتاج تنصيب websockets عبر pip

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Big Trades Tracker API",
              description="Real-time large trade monitoring for S&P 500 stocks")

# Security best practices for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Config and constants
class Trade(BaseModel):
    symbol: str
    price: float
    volume: int
    side: str
    timestamp: str

class Config(BaseModel):
    watched_symbols: List[str] = ["AAPL", "MSFT", "GOOGL", "AMZN", "META"]
    large_trade_threshold: float = 100000  # $100K minimum
    poll_interval: int = 2  # seconds

config = Config()
API_KEY = os.getenv("API_KEY", "70D7rupiLla29W4BPvlIr9UGp25_XnuQ")

# Connection manager for clients
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Remaining clients: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning(f"Failed to send message to a client: {e}")
                disconnected.append(connection)
        for dc in disconnected:
            self.disconnect(dc)

manager = ConnectionManager()

# --- WebSocket Proxy to Polygon.io ---
async def polygon_ws_proxy():
    url = f"wss://socket.polygon.io/stocks"
    logger.info("Starting Polygon.io WebSocket Proxy...")
    try:
        async with websockets.connect(url) as websocket:
            # Authenticate
            auth_msg = {"action": "auth", "params": API_KEY}
            await websocket.send(json.dumps(auth_msg))
            logger.info("Sent auth to Polygon.io")

            # Subscribe to symbols from config.watched_symbols (e.g. "T.AAPL")
            subscribe_msg = {
                "action": "subscribe",
                "params": ",".join(f"T.{sym}" for sym in config.watched_symbols)
            }
            await websocket.send(json.dumps(subscribe_msg))
            logger.info(f"Subscribed to Polygon.io symbols: {config.watched_symbols}")

            async for message in websocket:
                data = json.loads(message)
                # Polygon.io trade messages start with 'T.'
                if not isinstance(data, list):
                    continue
                large_trades = []
                for item in data:
                    if item.get('ev') == 'T':  # Trade event
                        price = item.get('p', 0)
                        volume = item.get('s', 0)
                        symbol = item.get('sym', '')
                        timestamp_ms = item.get('t', 0)
                        side = 'buy' if item.get('c', []) and 1 in item['c'] else 'sell'  # condition 1 = buy

                        if price * volume >= config.large_trade_threshold:
                            trade = Trade(
                                symbol=symbol,
                                price=price,
                                volume=volume,
                                side=side,
                                timestamp=datetime.utcfromtimestamp(timestamp_ms / 1000).isoformat()
                            )
                            large_trades.append(trade.dict())

                if large_trades:
                    payload = json.dumps({
                        "timestamp": datetime.utcnow().isoformat(),
                        "count": len(large_trades),
                        "trades": large_trades
                    })
                    await manager.broadcast(payload)

    except Exception as e:
        logger.error(f"Polygon.io WebSocket Proxy error: {e}")
        # Retry after delay
        await asyncio.sleep(5)
        await polygon_ws_proxy()

# Run polygon proxy in background on startup
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(polygon_ws_proxy())

# WebSocket endpoint for clients
@app.websocket("/ws/trades")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
        await websocket.close(code=1011)

# Other REST endpoints
@app.get("/")
def hello():
    return {"message": "✅ Backend running with Pydantic 1.10.13"}

@app.get("/config", response_model=Config)
def get_config():
    return config

@app.post("/config/update")
def update_config(new_config: Config):
    global config
    config = new_config
    return {"message": "Configuration updated"}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "connections": len(manager.active_connections),
        "last_updated": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
