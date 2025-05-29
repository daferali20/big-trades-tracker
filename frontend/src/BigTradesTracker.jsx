// BigTradesTracker.jsx
import React, { useEffect, useState } from 'react';
import StockCard from './StockCard';
import TradesTable from './TradesTable';
import './BigTradesTracker.css';

const apiKey = "YOUR_POLYGON_API_KEY";

function BigTradesTracker() {
  const [trades, setTrades] = useState([]);
  const [stockInfo, setStockInfo] = useState({});
  const [selectedSymbol, setSelectedSymbol] = useState('TSLA');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStockInfo = async (symbol) => {
    try {
      setLoading(true);
      setError(null);
      const [tickerRes, lastTradeRes, ma50Res, ma200Res] = await Promise.all([
        fetch(`https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${apiKey}`),
        fetch(`https://api.polygon.io/v2/last/trade/${symbol}?apiKey=${apiKey}`),
        fetch(`https://api.polygon.io/v1/indicators/sma/${symbol}?timespan=day&window=50&series_type=close&order=desc&limit=1&adjusted=true&apiKey=${apiKey}`),
        fetch(`https://api.polygon.io/v1/indicators/sma/${symbol}?timespan=day&window=200&series_type=close&order=desc&limit=1&adjusted=true&apiKey=${apiKey}`)
      ]);

      const [tickerData, lastTrade, ma50, ma200] = await Promise.all([
        tickerRes.json(),
        lastTradeRes.json(),
        ma50Res.json(),
        ma200Res.json()
      ]);

      return {
        symbol,
        name: tickerData.results?.name || '',
        currentPrice: lastTrade.results?.p || 0,
        week52High: tickerData.results?.week52High || 0,
        week52Low: tickerData.results?.week52Low || 0,
        ma50: ma50.results?.values[0]?.value || 0,
        ma200: ma200.results?.values[0]?.value || 0,
        ma35: 0,
        ma360: 0
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
    const loadInitialData = async () => {
      const tslaData = await fetchStockInfo('TSLA');
      if (tslaData) setStockInfo(prev => ({ ...prev, TSLA: tslaData }));
    };
    loadInitialData();

    const socket = new WebSocket("wss://delayed.polygon.io/stocks");
    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.price * data.volume >= 1000) {
        setTrades(prev => [data, ...prev.slice(0, 49)]);
        if (!stockInfo[data.symbol]) {
          const newStockData = await fetchStockInfo(data.symbol);
          if (newStockData) {
            setStockInfo(prev => ({ ...prev, [data.symbol]: newStockData }));
          }
        }
      }
    };
    socket.onerror = (err) => setError("فقدان الاتصال بخادم الصفقات الحية");
    socket.onclose = () => console.log("❌ WebSocket closed");
    return () => socket.close();
  }, [stockInfo]);

  const getRecommendations = () => {
    const ups = [], downs = [];
    for (const [symbol, info] of Object.entries(stockInfo)) {
      if (info.currentPrice > info.ma50 && info.currentPrice > info.ma200) ups.push(symbol);
      if (info.currentPrice < info.ma50 && info.currentPrice < info.ma200) downs.push(symbol);
    }
    return { ups, downs };
  };

  const getTopGainers = () => {
    return Object.values(stockInfo)
      .filter(info => info.week52Low > 0)
      .map(info => ({
        symbol: info.symbol,
        changePercent: ((info.currentPrice - info.week52Low) / info.week52Low) * 100
      }))
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);
  };

  const { ups, downs } = getRecommendations();
  const symbolToShow = selectedSymbol || (trades.length > 0 ? trades[0].symbol : null);

  return (
    <div className="big-trades-container">
      {loading && <div className="loading-indicator">جاري تحميل البيانات...</div>}
      {error && <div className="error-message">{error}</div>}

      <h2 style={{ textAlign: 'center' }}>📊 الصفقات الكبيرة للأسهم</h2>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
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

        <TradesTable trades={trades} />
      </div>

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

      {symbolToShow && (
        <div className="technical-analysis">
          <h3>📈 التحليل الفني لسهم {symbolToShow}</h3>
          <div className="indicators-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
            {["week52High", "week52Low", "ma50", "ma200", "ma35", "ma360", "currentPrice"].map((key, i) => (
              <StockCard
                key={key}
                label={[
                  "🔺 أعلى سعر 52 أسبوع",
                  "🔻 أدنى سعر 52 أسبوع",
                  "📊 متوسط 50 يوم",
                  "📊 متوسط 200 يوم",
                  "📊 متوسط 35 يوم",
                  "📊 متوسط 360 يوم",
                  "💲 السعر الحالي"
                ][i]}
                value={stockInfo[symbolToShow][key]}
                highlight={
                  key === 'currentPrice'
                    ? (stockInfo[symbolToShow][key] > stockInfo[symbolToShow].ma50 ? '#2ecc71' : '#e74c3c')
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      )}

     

      <div style={{ marginTop: '2rem' }}>
        <h3>📈 الأسهم المرشحة للصعود</h3>
        <div>{ups.length > 0 ? ups.join(", ") : "لا يوجد حالياً"}</div>

        <h3 style={{ marginTop: '1rem' }}>📉 الأسهم المرشحة للهبوط</h3>
        <div>{downs.length > 0 ? downs.join(", ") : "لا يوجد حالياً"}</div>

        <h3 style={{ marginTop: '1rem' }}>🚀 الأسهم الأكثر ارتفاعاً عن أدنى مستوى 52 أسبوع</h3>
        <ul>
          {getTopGainers().map(item => (
            <li key={item.symbol}>{item.symbol} - {item.changePercent.toFixed(2)}%</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default BigTradesTracker;
