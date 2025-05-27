import yfinance as yf
import pandas as pd

def get_stock_stats(symbol: str):
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period="1y")

    if hist.empty:
        return {"error": "No data found for symbol."}

    week52_high = hist['High'].max()
    week52_low = hist['Low'].min()
    ma50 = hist['Close'].rolling(window=50).mean().iloc[-1]
    ma200 = hist['Close'].rolling(window=200).mean().iloc[-1]
    ma35 = hist['Close'].rolling(window=35).mean().iloc[-1]
    ma360 = hist['Close'].rolling(window=360).mean().iloc[-1] if len(hist) >= 360 else None
    current_price = hist['Close'].iloc[-1]

    return {
        "symbol": symbol.upper(),
        "week52High": round(week52_high, 2),
        "week52Low": round(week52_low, 2),
        "ma50": round(ma50, 2),
        "ma200": round(ma200, 2),
        "ma35": round(ma35, 2),
        "ma360": round(ma360, 2) if ma360 else "N/A",
        "currentPrice": round(current_price, 2)
    }
def get_stock_stats(symbol: str):
    # دالة وهمية أو تستخدم yfinance لجلب التحليل
    return {
        "symbol": symbol,
        "week52High": 199.62,
        "week52Low": 149.84,
        "ma50": 172.5,
        "ma200": 165.8,
        "ma35": 175.2,
        "ma360": "N/A",
        "currentPrice": 178.2
    }
