import streamlit as st
import requests

# 🔗 عنوان السيرفر الخلفي على Render
API_URL = "https://your-app-name.onrender.com"

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
