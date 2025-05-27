import './BigTradesTracker.css';
import React, { useEffect, useState } from 'react';
import TradingViewChart from './TradingViewChart';

function BigTradesTracker() {
  const [trades, setTrades] = useState([]);
  const [stockInfo, setStockInfo] = useState({});
  const [useMock, setUseMock] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(NULL);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws/mock-trades");
    const timeout = setTimeout(() => {
      setUseMock(true);
      socket.close();
    }, 7000);

    socket.onmessage = async (event) => {
      clearTimeout(timeout);
      const data = JSON.parse(event.data);

      if (data.price * data.volume >= 500) {
        setTrades(prev => [data, ...prev.slice(0, 49)]);

        if (!stockInfo[data.symbol]) {
          try {
            const res = await fetch(`http://localhost:8000/stock-info/${data.symbol}`);
            const info = await res.json();
            setStockInfo(prev => ({ ...prev, [data.symbol]: info }));
          } catch (err) {
            console.error("فشل جلب بيانات السهم:", err);
          }
        }
      }
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

  const getRecommendations = () => {
    const ups = [], downs = [];
    for (const [symbol, info] of Object.entries(stockInfo)) {
      if (info.currentPrice > info.ma50 && info.currentPrice > info.ma200) ups.push(symbol);
      if (info.currentPrice < info.ma50 && info.currentPrice < info.ma200) downs.push(symbol);
    }
    return { ups, downs };
  };
// تحديد رمز افتراضي بمجرد تحميل بيانات السهم
useEffect(() => {
  if (!selectedSymbol && Object.keys(stockInfo).length > 0) {
    const firstSymbol = Object.keys(stockInfo)[0];
    setSelectedSymbol(firstSymbol);
  }
}, [stockInfo, selectedSymbol]);
  const { ups, downs } = getRecommendations();
  const symbolToShow = selectedSymbol || (trades.length > 0 ? selectedSymbol : null);

  return (
    <div className="big-trades-container">
      <h2 style={{ textAlign: 'center' }}>
        📊 {useMock ? "صفقات وهمية كبيرة (Mock)" : "الصفقات الكبيرة للأسهم"}
      </h2>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        {/* قائمة الأسهم */}
        <div className="sidebar">
          <h4>🧾 قائمة الأسهم</h4>
          <ul>
            {Object.keys(stockInfo).map(TSLA => (
              <li
                key={symbol}
                onClick={() => setSelectedSymbol(symbol)}
                className={symbol === symbolToShow ? 'active-symbol' : ''}
              >
                {symbol}
              </li>
            ))}
          </ul>
        </div>

        {/* جدول الصفقات */}
        <div className="table-container">
          <table className="trades-table">
            <thead>
              <tr>
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
                  className={trade.side === "Buy" ? "trade-buy" : "trade-sell"}
                  key={index}
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
        </div>
      </div>

      {/* اختيار سهم لعرض التفاصيل */}
      <div style={{ margin: '1rem 0' }}>
        <label htmlFor="stock-select">اختر السهم لعرض تفاصيله:</label>
        <select
          id="stock-select"
          value={selectedSymbol || ""}
          onChange={(e) => setSelectedSymbol(e.target.value)}
          style={{ marginRight: '1rem', padding: '0.3rem', minWidth: '150px' }}
        >
          <option value="" disabled>اختر رمز السهم</option>
          {Object.keys(stockInfo).map((TSLA) => (
            <option key={symbol} value={symbol}>{symbol}</option>
          ))}
        </select>
      </div>

      {/* التحليل الفني */}
      {symbolToShow && stockInfo[symbolToShow] && (
        <>
          <h3>📈 التحليل الفني لسهم {symbolToShow}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
            {[
              ["🔺 أعلى سعر 52 أسبوع", "week52High"],
              ["🔻 أدنى سعر 52 أسبوع", "week52Low"],
              ["📊 متوسط 50 يوم", "ma50"],
              ["📊 متوسط 200 يوم", "ma200"],
              ["📊 متوسط 35 يوم", "ma35"],
              ["📊 متوسط 360 يوم", "ma360"],
              ["💲 السعر الحالي", "currentPrice"]
            ].map(([label, key]) => (
              <div key={key} style={{
                background: '#f9f9f9',
                padding: '1rem',
                borderRadius: '10px',
                minWidth: '150px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>{label}</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{stockInfo[symbolToShow][key]}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* الشارت */}
      {symbolToShow && (
        <TradingViewChart symbol={symbolToShow} />
      )}

      {/* التوصيات */}
      <div style={{ marginTop: '2rem' }}>
        <h3>📈 الأسهم المرشحة للصعود</h3>
        <div>{ups.length > 0 ? ups.join(", ") : "لا يوجد حالياً"}</div>

        <h3 style={{ marginTop: '1rem' }}>📉 الأسهم المرشحة للهبوط</h3>
        <div>{downs.length > 0 ? downs.join(", ") : "لا يوجد حالياً"}</div>
      </div>
    </div>
  );
}

export default BigTradesTracker;
