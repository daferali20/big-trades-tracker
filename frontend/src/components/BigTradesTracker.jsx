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


    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => socket.close();
  }, []);
  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ textAlign: 'center' }}>📊 الصفقات الكبيرة للأسهم المؤثرة</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th>الرمز</th>
            <th>السعر</th>
            <th>الكمية</th>
            <th>الوقت</th>
            <th>الصفقة</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
              <td>{trade.symbol}</td>
              <td>{trade.price}</td>
              <td>{trade.volume}</td>
              <td>{new Date(trade.timestamp).toLocaleTimeString()}</td>
              <td>{trade.side}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
print("✅ Received from polygon:", data)
export default BigTradesTracker;
