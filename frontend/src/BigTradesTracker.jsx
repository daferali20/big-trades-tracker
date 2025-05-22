// BigTradesTracker.jsx
import React, { useEffect, useState } from 'react';

export default function BigTradesTracker() {
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    const socket = new WebSocket("wss://big-trades-backend.onrender.com/ws/trades");
    socket.onmessage = function(event) {
  const trade = JSON.parse(event.data);
  console.log(trade); // عرض الصفقة في الكونسول
};

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => socket.close();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">📈 الصفقات الكبيرة للأسهم المؤثرة</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trades.map((trade, index) => (
          <div key={index} className="bg-white p-4 rounded-2xl shadow-md border-l-8"
               style={{ borderColor: trade.side === 'buy' ? '#22c55e' : '#ef4444' }}>
            <div className="text-xl font-semibold">{trade.symbol}</div>
            <div className="text-gray-600">💰 السعر: ${trade.price.toFixed(2)}</div>
            <div className="text-gray-600">📦 الحجم: {trade.volume.toLocaleString()}</div>
            <div className="text-gray-600">🔄 القيمة: ${(trade.price * trade.volume).toLocaleString()} $</div>
            <div className="text-sm text-gray-400 mt-1">⏱️ {new Date(trade.timestamp).toLocaleTimeString()}</div>
            <div className={`mt-2 px-2 inline-block rounded text-white ${trade.side === 'buy' ? 'bg-green-500' : 'bg-red-500'}`}>
              {trade.side === 'buy' ? 'شراء قوي' : 'بيع قوي'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
