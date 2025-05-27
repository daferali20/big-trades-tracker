import React, { useEffect, useState } from 'react';

function BigTradesTracker() {
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/trades');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setTrades((prev) => [data, ...prev.slice(0, 19)]); // keep latest 20
    };

    return () => ws.close();
  }, []);

  return (
    <div>
      <h2>صفقات كبيرة لحظية</h2>
      <table>
        <thead>
          <tr>
            <th>السهم</th>
            <th>السعر</th>
            <th>الحجم</th>
            <th>الوقت</th>
            <th>الاتجاه</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, index) => (
            <tr key={index}>
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

export default BigTradesTracker;