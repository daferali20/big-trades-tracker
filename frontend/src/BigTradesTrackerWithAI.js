import React, { useEffect, useState } from 'react';
import TradingViewChart from './TradingViewChart';
import './BigTradesTracker.css';

function BigTradesTrackerWithAI() {
  const [trades, setTrades] = useState([]);
  const [stockInfo, setStockInfo] = useState({});
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [recommendation, setRecommendation] = useState(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws/mock-trades");

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.price * data.volume >= 500) {
        setTrades(prev => [data, ...prev.slice(0, 49)]);

        if (!stockInfo[data.symbol]) {
          try {
            const res = await fetch(`http://localhost:8000/stock-info/${data.symbol}`);
            const info = await res.json();
            setStockInfo(prev => ({ ...prev, [data.symbol]: info }));
          } catch (err) {
            console.error("Error fetching stock info:", err);
          }
        }
      }
    };

    return () => socket.close();
  }, [stockInfo]);

  useEffect(() => {
    if (!selectedSymbol) return;
    fetch(`http://localhost:8000/ai-recommendation/${selectedSymbol}`)
      .then(res => res.json())
      .then(data => setRecommendation(data))
      .catch(err => console.error("AI Recommendation error:", err));
  }, [selectedSymbol]);

  const symbolToShow = selectedSymbol || (trades.length > 0 ? trades[0].symbol : null);

  return (
    <div className="big-trades-container">
      <h2 style={{ textAlign: 'center' }}>💹 التوصيات اللحظية وتحليل الأسهم</h2>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ width: '20%' }}>
          <h4>📋 الأسهم المتوفرة</h4>
          <ul>
            {Object.keys(stockInfo).map(symbol => (
              <li
                key={symbol}
                onClick={() => setSelectedSymbol(symbol)}
                style={{ cursor: 'pointer', fontWeight: symbol === symbolToShow ? 'bold' : 'normal' }}
              >
                {symbol}
              </li>
            ))}
          </ul>

          <h4>👤 دخول الأعضاء</h4>
          <input type="email" placeholder="البريد الإلكتروني" style={{ width: '100%', marginBottom: '0.5rem' }} />
          <input type="password" placeholder="كلمة المرور" style={{ width: '100%', marginBottom: '0.5rem' }} />
          <button style={{ width: '100%' }}>تسجيل الدخول</button>

          <h4 style={{ marginTop: '1rem' }}>💳 الاشتراكات</h4>
          <table style={{ width: '100%', fontSize: '0.9rem' }}>
            <thead>
              <tr><th>المدة</th><th>السعر</th></tr>
            </thead>
            <tbody>
              <tr><td>شهري</td><td>50 ريال</td></tr>
              <tr><td>3 أشهر</td><td>135 ريال</td></tr>
              <tr><td>9 أشهر</td><td>350 ريال</td></tr>
            </tbody>
          </table>
        </div>

        <div style={{ width: '80%' }}>
          {symbolToShow && (
            <>
              <h3>🧠 توصية الذكاء الاصطناعي لسهم {symbolToShow}</h3>
              <div style={{ background: '#f0f0f0', padding: '1rem', borderRadius: '8px' }}>
                {recommendation ? (
                  <>
                    <p><strong>توصية:</strong> {recommendation.action}</p>
                    <p><strong>الهدف:</strong> {recommendation.target}</p>
                    <p><strong>نقطة الدخول:</strong> {recommendation.entry}</p>
                  </>
                ) : <p>جاري التحميل...</p>}
              </div>

              <TradingViewChart symbol={symbolToShow} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default BigTradesTrackerWithAI;
