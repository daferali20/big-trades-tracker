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

⚙️
👨‍💻 المطور

daferali20
