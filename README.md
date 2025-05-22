📊 Big Trades Tracker

تطبيق لحظي يقوم بتتبع الصفقات الكبيرة (Block Trades) للأسهم المؤثرة في المؤشرات الأمريكية، ويعرضها بشكل مباشر باستخدام WebSocket وتقنيات حديثة مثل FastAPI وReact.

🚀 مميزات التطبيق

🔍 تتبع لحظي للصفقات الكبيرة في أسهم مثل AAPL, MSFT, GOOGL وغيرها.

🔔 تحديد الصفقات الكبيرة بناءً على القيمة المالية (مثلاً فوق 100,000 دولار).

📡 بث مباشر باستخدام WebSocket.

🧠 واجهة مستخدم تفاعلية تظهر معلومات الصفقة واتجاهها (شراء / بيع).

🏗️ هيكل المشروع

big-trades-tracker/
├── backend/
│   └── big_trades_tracker_backend.py     # كود FastAPI والبث اللحظي
├── frontend/
│   └── src/
│       ├── BigTradesTracker.jsx          # مكون React الرئيسي
│       └── App.jsx                       # نقطة الدخول للواجهة الأمامية
├── .gitignore
└── README.md

⚙️ طريقة التشغيل

1. تشغيل الخلفية (Backend - FastAPI)

cd backend
pip install fastapi uvicorn httpx
uvicorn big_trades_tracker_backend:app --reload

سيتم تشغيل الخادم على: http://localhost:8000

2. تشغيل الواجهة الأمامية (Frontend - React)

cd frontend
npm install
npm run dev

سيتم تشغيل الواجهة على: http://localhost:5173

⚠️ ملاحظة:

تأكد من أن WebSocket في BigTradesTracker.jsx يشير إلى:

const socket = new WebSocket('ws://localhost:8000/ws/trades');

🧠 مستقبلًا يمكنك:

ربط التطبيق ببيانات حقيقية من Polygon.io أو IEX Cloud.

تخزين الصفقات في قاعدة بيانات مثل MongoDB.

إرسال تنبيهات للمستخدمين عبر البريد أو الجوال.

دعم فلاتر حسب الرمز، المؤشر، القيمة، إلخ.

👨‍💻 المطور

daferali20
