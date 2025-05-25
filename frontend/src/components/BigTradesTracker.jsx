import React, { useEffect, useState } from 'react';

function BigTradesTracker() {
  const [trades, setTrades] = useState([]);

 useEffect(() => {
    const socket = new WebSocket("wss://big-trades-tracker.onrender.com/ws/trades");

    socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("📩 Received trade:", data); // تحقق من ظهور البيانات هنا
  setTrades(prev => [data, ...prev.slice(0, 49)]);
};


    socket.onerror = (err) => console.error("WebSocket Error:", err);
    socket.onclose = () => console.log("❌ WebSocket مغلق");

    return () => {
      clearTimeout(timeout);
      socket.close();
    };
  }, [stockInfo]);

  useEffect(() => {
    if (!useMock) return;

    const interval = setInterval(() => {
      const mockTrade = {
        symbol: ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN"][Math.floor(Math.random() * 5)],
        price: parseFloat((Math.random() * 300 + 50).toFixed(2)),
        volume: Math.floor(Math.random() * 900 + 100),
        timestamp: Date.now(),
        side: Math.random() > 0.5 ? "Buy" : "Sell"
      };

      if (mockTrade.price * mockTrade.volume >= 10000) {
        setTrades(prev => [mockTrade, ...prev.slice(0, 49)]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [useMock]);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h2 style={{ textAlign: 'center' }}>
        📊 {useMock ? "صفقات وهمية كبيرة (Mock)" : "الصفقات الكبيرة للأسهم"}
      </h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th>الرمز</th>
            <th>السعر</th>
            <th>الكمية</th>
            <th>القيمة</th>
            <th>الوقت</th>
            <th>الصفقة</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, index) => (
            <tr
              key={index}
              style={{
                borderBottom: '1px solid #ddd',
                backgroundColor: trade.side === "Buy" ? '#e0ffe0' : '#ffe0e0'
              }}
            >
              <td>{trade.symbol}</td>
              <td>{trade.price}</td>
              <td>{trade.volume}</td>
              <td>{(trade.price * trade.volume).toLocaleString()}</td>
              <td>{new Date(trade.timestamp).toLocaleTimeString('ar-EG')}</td>
              <td>{trade.side}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* عرض التحليل الفني للسهم الأخير */}
      {trades.length > 0 && stockInfo[trades[0].symbol] && (
        <div style={{ marginTop: "2rem", background: "#f9f9f9", padding: "1rem", borderRadius: "10px" }}>
          <h3>📈 التحليل الفني لسهم {trades[0].symbol}</h3>
          <table>
            <tbody>
              <tr><td>🔺 أعلى سعر 52 أسبوع</td><td>{stockInfo[trades[0].symbol].week52High}</td></tr>
              <tr><td>🔻 أدنى سعر 52 أسبوع</td><td>{stockInfo[trades[0].symbol].week52Low}</td></tr>
              <tr><td>📊 متوسط 50 يوم</td><td>{stockInfo[trades[0].symbol].ma50}</td></tr>
              <tr><td>📊 متوسط 200 يوم</td><td>{stockInfo[trades[0].symbol].ma200}</td></tr>
              <tr><td>📊 متوسط 35 يوم</td><td>{stockInfo[trades[0].symbol].ma35}</td></tr>
              <tr><td>📊 متوسط 360 يوم</td><td>{stockInfo[trades[0].symbol].ma360}</td></tr>
              <tr><td>💲 السعر الحالي</td><td>{stockInfo[trades[0].symbol].currentPrice}</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BigTradesTracker;
