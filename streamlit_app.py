import streamlit as st
import asyncio
import json
from websockets import connect

st.set_page_config(page_title="Big Trades Tracker", layout="wide")

st.title("🤑 Big Trades Tracker - Streamlit")

# عرض حالة الاتصال
status_placeholder = st.empty()

# جدول البيانات
trades_placeholder = st.empty()

# إعداد WebSocket URL (تأكد من تعديل العنوان إلى عنوان backend الخاص بك)
WEBSOCKET_URL = "ws://big-trades-tracker.onrender.com/ws/trades"

async def listen_trades():
    async with connect(WEBSOCKET_URL) as websocket:
        status_placeholder.info("🔌 Connected to backend WebSocket!")
        while True:
            try:
                message = await websocket.recv()
                data = json.loads(message)
                trades = data.get("trades", [])
                if trades:
                    # تحويل البيانات لعرضها في DataFrame
                    import pandas as pd
                    df = pd.DataFrame(trades)
                    df['timestamp'] = pd.to_datetime(df['timestamp'])
                    trades_placeholder.dataframe(df)
            except Exception as e:
                status_placeholder.error(f"❌ Error: {e}")
                break

def main():
    st.info("Connecting to backend WebSocket...")
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(listen_trades())

if __name__ == "__main__":
    main()

st.title("📈 Big Trades Tracker")

# جلب رسالة الترحيب من FastAPI
try:
    response = requests.get(f"{API_URL}/")
    data = response.json()
    st.success(f"Connected to backend: {data['message']}")
except Exception as e:
    st.error("❌ Failed to connect to backend")
    st.exception(e)

# إذا كان لديك WebSocket أو بيانات أكثر، ممكن تضيفها هنا
