import streamlit as st
import asyncio
import websockets
import json
from threading import Thread

# رابط WebSocket للاتصال بالـ backend (غيره إلى رابط سيرفرك الحقيقي)
WEBSOCKET_URL = "ws://big-trades-tracker.onrender.com/ws/trades"

st.title("📈 متتبع الصفقات الكبيرة للأسهم (Big Trades Tracker)")

# هنا سنخزن الصفقات الواردة في قائمة (محدودة لآخر 50 صفقة)
trades = []

# دالة الاستماع للويب سوكيت بشكل غير متزامن مع التحديث الدوري للصفقات
async def listen_trades():
    global trades
    try:
        async with websockets.connect(WEBSOCKET_URL) as websocket:
            while True:
                message = await websocket.recv()
                data = json.loads(message)
                # شرط لإضافة الصفقات ذات حجم كبير (مثلاً سعر * حجم >= 1000)
                if data.get("price", 0) * data.get("volume", 0) >= 1000:
                    trades.insert(0, data)  # نضيف الصفقة في أول القائمة
                    if len(trades) > 50:
                        trades.pop()  # نحافظ على 50 صفقة فقط
    except Exception as e:
        st.error(f"خطأ في الاتصال بـ WebSocket: {e}")

# لتشغيل asyncio في Streamlit نستخدم Thread منفصل
def run_async_loop():
    asyncio.run(listen_trades())

# نبدأ الويب سوكيت في خلفية مستقلة حتى لا يحجب واجهة المستخدم
if "thread_started" not in st.session_state:
    thread = Thread(target=run_async_loop, daemon=True)
    thread.start()
    st.session_state.thread_started = True

# عرض بيانات الصفقات كل ثانية تقريباً مع تحديث الصفحة
import time

st.write("آخر 50 صفقة كبيرة (سعر * حجم >= 1000):")

# تحديث المحتوى تلقائياً كل ثانية
placeholder = st.empty()

for _ in range(1000):  # عدد مرات التحديث (يمكن تغييره)
    if trades:
        # عرض جدول مبسط بالصفقات
        placeholder.table([
            {
                "السهم": t.get("symbol", ""),
                "السعر": t.get("price", ""),
                "الحجم": t.get("volume", ""),
                "الوقت": t.get("timestamp", "")
            }
            for t in trades
        ])
    else:
        placeholder.text("جارٍ انتظار صفقات جديدة...")

    time.sleep(1)
