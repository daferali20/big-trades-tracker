# big_trades_tracker_backend.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import asyncio
import httpx
from datetime import datetime
import logging
from pydantic import BaseModel
import os

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

# Configuration Models
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

# Initialize configuration
config = Config()
API_KEY = os.getenv("API_KEY", "70D7rupiLla29W4BPvlIr9UGp25_XnuQ")

# WebSocket Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New connection. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"Disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: Dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Broadcast error: {e}")
                self.disconnect(connection)

manager = ConnectionManager()

# Real Data Fetching with error handling
async def fetch_real_trades(symbol: str) -> List[Trade]:
    """Fetch actual trade data from financial API"""
    try:
        async with httpx.AsyncClient() as client:
            # Example using Polygon.io (replace with actual endpoint)
            url = f"https://api.polygon.io/v3/trades/{symbol}?apiKey={API_KEY}"
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()
            
            trades = []
            for item in response.json().get("results", []):
                trades.append(Trade(
                    symbol=symbol,
                    price=item["price"],
                    volume=item["size"],
                    side="buy" if item["conditions"][0] == 1 else "sell",
                    timestamp=datetime.fromtimestamp(item["timestamp"]/1000).isoformat()
                ))
            return trades
            
    except Exception as e:
        logger.error(f"Error fetching trades for {symbol}: {str(e)}")
        return []

# WebSocket Endpoint
@app.websocket("/ws/trades")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            large_trades = []
            for symbol in config.watched_symbols:
                trades = await fetch_real_trades(symbol)
                large_trades.extend([
                    trade.dict() for trade in trades 
                    if trade.price * trade.volume >= config.large_trade_threshold
                ])
            
            if large_trades:
                await manager.broadcast({
                    "timestamp": datetime.utcnow().isoformat(),
                    "count": len(large_trades),
                    "trades": large_trades
                })
            
            await asyncio.sleep(config.poll_interval)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.close(code=1011)

from fastapi import FastAPI

app = FastAPI()
@app.get("/")
def hello():
    return {"message": "✅ Backend running with Pydantic 1.10.13"}
# REST Endpoints
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
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
