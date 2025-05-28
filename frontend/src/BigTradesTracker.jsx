import './BigTradesTracker.css';
import React, { useEffect, useState } from 'react';
import TradingViewChart from './TradingViewChart';

function BigTradesTracker() {
  const [trades, setTrades] = useState([]);
  const [stockInfo, setStockInfo] = useState({});
  const [useMock, setUseMock] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('TSLA'); // تغيير هنا لجعل TSLA افتراضي
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // دالة مساعدة لجلب بيانات السهم من Polygon.io
  const fetchStockInfo = async (symbol) => {
    try {
      setLoading(true);
      setError(null);
      
      // جلب البيانات الأساسية
      const fetchRealTimeData = async (symbol) => {
  try {
    const response = await fetch(
      `https://api.polygon.io/v2/last/trade/${symbol}?apiKey=${process.env.REACT_APP_POLYGON_API_KEY}`
    );
    return await response.json();
  } catch (error) {
    console.error("Error fetching real-time data:", error);
    return null;
  }
};
      // جلب البيانات الفنية (المتوسطات المتحركة)
      const ma50Response = await fetch(
        `https://api.polygon.io/v1/indicators/sma/${symbol}?timespan=day&window=50&apiKey=${process.env.REACT_APP_POLYGON_API_KEY}`
      );
      const ma50Data = await ma50Response.json();

      const ma200Response = await fetch(
        `https://api.polygon.io/v1/indicators/sma/${symbol}?timespan=day&window=200&apiKey=${process.env.REACT_APP_POLYGON_API_KEY}`
      );
      const ma200Data = await ma200Response.json();

      return {
        symbol: symbol,
        name: tickerData.results?.name || '',
        currentPrice: tickerData.results?.lastSale?.price || 0,
        week52High: tickerData.results?.week52High || 0,
        week52Low: tickerData.results?.week52Low || 0,
        ma50: ma50Data.results?.values[0]?.value || 0,
        ma200: ma200Data.results?.values[0]?.value || 0,
        ma35: 0, // يمكن استبدالها بطلب حقيقي إذا كان متاحاً
        ma360: 0  // يمكن استبدالها بطلب حقيقي إذا كان متاحاً
      };
    } catch (err) {
      console.error("Error fetching stock info:", err);
      setError("فشل في جلب بيانات السهم. يرجى المحاولة لاحقاً.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // جلب بيانات TSLA الافتراضية عند التحميل
    const loadInitialData = async () => {
      const tslaData = await fetchStockInfo('TSLA');
      if (tslaData) {
        setStockInfo(prev => ({ ...prev, TSLA: tslaData }));
      }
    };
    loadInitialData();

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
          const newStockData = await fetchStockInfo(data.symbol);
          if (newStockData) {
            setStockInfo(prev => ({ ...prev, [data.symbol]: newStockData }));
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
  }, []);

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

  const { ups, downs } = getRecommendations();
  const symbolToShow = selectedSymbol || (trades.length > 0 ? trades[0].symbol : null);

  return (
    <div className="big-trades-container">
      {loading && <div className="loading-indicator">جاري تحميل البيانات...</div>}
      {error && <div className="error-message">{error}</div>}

      <h2 style={{ textAlign: 'center' }}>
        📊 {useMock ? "صفقات وهمية كبيرة (Mock)" : "الصفقات الكبيرة للأسهم"}
      </h2>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        {/* قائمة الأسهم */}
        <div className="sidebar">
          <h4>🧾 قائمة الأسهم</h4>
          <ul>
            {Object.keys(stockInfo).map(symbol => (
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
          value={selectedSymbol}
          onChange={(e) => setSelectedSymbol(e.target.value)}
          style={{ marginRight: '1rem', padding: '0.3rem', minWidth: '150px' }}
        >
          {Object.keys(stockInfo).map((symbol) => (
            <option key={symbol} value={symbol}>{symbol}</option>
          ))}
        </select>
      </div>

      {/* التحليل الفني */}
{symbolToShow && (
  <div className="technical-analysis">
    <h3>📈 التحليل الفني لسهم {symbolToShow}</h3>
    
    {loading ? (
      <div className="loading-indicator">
        <p>جاري تحميل البيانات...</p>
      </div>
    ) : (
      stockInfo[symbolToShow] && (
        <div className="indicators-grid" style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '1rem', 
          marginTop: '1rem'
        }}>
          {[
            ["🔺 أعلى سعر 52 أسبوع", "week52High"],
            ["🔻 أدنى سعر 52 أسبوع", "week52Low"],
            ["📊 متوسط 50 يوم", "ma50"],
            ["📊 متوسط 200 يوم", "ma200"],
            ["📊 متوسط 35 يوم", "ma35"],
            ["📊 متوسط 360 يوم", "ma360"],
            ["💲 السعر الحالي", "currentPrice"]
          ].map(([label, key]) => (
            <div 
              key={key}
              className="indicator-card"
              style={{
                background: '#f9f9f9',
                padding: '1rem',
                borderRadius: '10px',
                minWidth: '150px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                textAlign: 'center',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ fontSize: '0.9rem', color: '#666' }}>{label}</div>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '1.2rem',
                color: key === 'currentPrice' ? 
                  (stockInfo[symbolToShow][key] > stockInfo[symbolToShow]['ma50'] ? '#2ecc71' : '#e74c3c') 
                  : 'inherit'
              }}>
                {typeof stockInfo[symbolToShow][key] === 'number' ? 
                  stockInfo[symbolToShow][key].toFixed(2) : 
                  stockInfo[symbolToShow][key]}
              </div>
            </div>
          ))}
        </div>
      )
    )}

    {error && (
      <div className="error-message" style={{
        color: '#e74c3c',
        marginTop: '1rem'
      }}>
        {error}
      </div>
    )}
  </div>
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
