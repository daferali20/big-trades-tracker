import './BigTradesTracker.css';
import React, { useEffect, useState } from 'react';
import TradingViewChart from './TradingViewChart';

function BigTradesTracker() {
  const [trades, setTrades] = useState([]);
  const [stockInfo, setStockInfo] = useState({});
  const [useMock, setUseMock] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('TSLA');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // دالة لجلب بيانات السهم من Polygon.io
  const fetchStockDataFromPolygon = async (symbol) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${process.env.REACT_APP_POLYGON_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch stock data');
      }
      
      const data = await response.json();
      
      // جلب البيانات الفنية الإضافية
      const technicalResponse = await fetch(
        `https://api.polygon.io/v1/indicators/sma/${symbol}?timespan=day&adjusted=true&window=50&series_type=close&apiKey=${process.env.REACT_APP_POLYGON_API_KEY}`
      );
      
      const technicalData = await technicalResponse.json();
      
      return {
        symbol: data.results.ticker,
        name: data.results.name,
        currentPrice: data.results.lastSale?.price || 0,
        week52High: data.results.week52High,
        week52Low: data.results.week52Low,
        ma50: technicalData.results.values[0]?.value || 0,
        ma200: technicalData.results.values[0]?.value || 0,
        // يمكنك إضافة المزيد من البيانات حسب احتياجاتك
      };
    } catch (err) {
      console.error("Error fetching from Polygon.io:", err);
      setError("فشل في جلب بيانات السهم. يرجى المحاولة لاحقاً.");
      return null;
    } finally {
      setLoading(false);
    }
  };
 useEffect(() => {
    // جلب بيانات TSLA أولاً عند التحميل
    const loadInitialStock = async () => {
      const tslaData = await fetchStockDataFromPolygon('TSLA');
      if (tslaData) {
        setStockInfo(prev => ({ ...prev, TSLA: tslaData }));
      }
    };
    loadInitialStock();

    // ... (بقية كود useEffect الأصلي)
  }, []);

  // تعديل دالة جلب البيانات عند اختيار سهم جديد
  useEffect(() => {
    if (selectedSymbol && !stockInfo[selectedSymbol]) {
      const loadStockData = async () => {
        const stockData = await fetchStockDataFromPolygon(selectedSymbol);
        if (stockData) {
          setStockInfo(prev => ({ ...prev, [selectedSymbol]: stockData }));
        }
      };
      loadStockData();
    }
  }, [selectedSymbol]);

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
                className={symbol === selectedSymbol ? 'active-symbol' : ''} // تغيير هنا لاستخدام selectedSymbol مباشرة
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
            value={selectedSymbol} // تغيير هنا لإظهار القيمة المحددة
            onChange={(e) => setSelectedSymbol(e.target.value)}
            style={{ marginRight: '1rem', padding: '0.3rem', minWidth: '150px' }}
          >
            {Object.keys(stockInfo).map((symbol) => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
        </div>

        {/* التحليل الفني */}
        {selectedSymbol && stockInfo[selectedSymbol] && ( // تغيير هنا لاستخدام selectedSymbol مباشرة
          <>
            <h3>📈 التحليل الفني لسهم {selectedSymbol}</h3>
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
        {selectedSymbol && (
          <TradingViewChart symbol={selectedSymbol} /> // تغيير هنا لاستخدام selectedSymbol
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
