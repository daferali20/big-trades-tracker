import React, { useEffect, useState } from 'react';
import TradingViewChart from './TradingViewChart';
import StockCard from './StockCard';
import TradesTable from './TradesTable';
import './BigTradesTracker.css';

function BigTradesTracker() {
  const [trades, setTrades] = useState([]);
  const [stockInfo, setStockInfo] = useState({});
  const [selectedSymbol, setSelectedSymbol] = useState('TSLA');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiKey = 'd0s84hpr01qkkpltj8j0d0s84hpr01qkkpltj8jg';

  // جلب بيانات السهم من Finnhub (باقي الكود كما لديك)
  const fetchStockInfo = async (symbol) => {
    try {
      setLoading(true);
      setError(null);

      const [profileRes, quoteRes, ma50Res, ma200Res] = await Promise.all([
        fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`),
        fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`),
        fetch(`https://finnhub.io/api/v1/indicator?symbol=${symbol}&resolution=D&indicator=sma&timeperiod=50&token=${apiKey}`),
        fetch(`https://finnhub.io/api/v1/indicator?symbol=${symbol}&resolution=D&indicator=sma&timeperiod=200&token=${apiKey}`)
      ]);

      const [profile, quote, ma50, ma200] = await Promise.all([
        profileRes.json(),
        quoteRes.json(),
        ma50Res.json(),
        ma200Res.json()
      ]);

      return {
        symbol,
        name: profile.name || symbol,
        currentPrice: quote.c || 0,
        week52High: quote.h || 0,
        week52Low: quote.l || 0,
        ma50: ma50?.technicalAnalysis?.sma?.[0] || 0,
        ma200: ma200?.technicalAnalysis?.sma?.[0] || 0,
        ma35: 0,
        ma360: 0
      };
    } catch (err) {
      console.error("Error fetching stock info from Finnhub:", err);
      setError("فشل في جلب بيانات السهم من Finnhub.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      const tslaData = await fetchStockInfo('TSLA');
      if (tslaData) {
        setStockInfo(prev => ({ ...prev, TSLA: tslaData }));
      }
    };
    loadInitialData();

    // هنا اتصال الـ WebSocket بالـ backend الخاص بك
    const socket = new WebSocket("ws://big-trades-tracker.onrender.com0/ws/trades"); // استبدلها بـ URL الباك اند الحي

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      // تحديث صفقات مع جلب بيانات سهم جديد إذا لم تكن موجودة
      setTrades(prev => [data, ...prev.slice(0, 49)]);

      if (!stockInfo[data.sym]) {
        const newStockData = await fetchStockInfo(data.sym);
        if (newStockData) {
          setStockInfo(prev => ({ ...prev, [data.sym]: newStockData }));
        }
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket Error:", err);
      setError("فقدان الاتصال بخادم الصفقات الحية");
    };

    socket.onclose = () => console.log("❌ تم إغلاق اتصال WebSocket");

    return () => {
      socket.close();
    };
  }, [stockInfo]);

  // باقي دوالك getTopGainers, getRecommendations، والـ JSX كما هي في الكود الذي أرسلته

  const getTopGainers = () => {
    return Object.values(stockInfo)
      .filter(info => info?.week52Low > 0)
      .map(info => ({
        symbol: info.symbol,
        changePercent: ((info.currentPrice - info.week52Low) / info.week52Low) * 100
      }))
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);
  };

  const getRecommendations = () => {
    const ups = [], downs = [];
    for (const [symbol, info] of Object.entries(stockInfo)) {
      if (!info) continue;
      if (info.currentPrice > info.ma50 && info.currentPrice > info.ma200) ups.push(symbol);
      if (info.currentPrice < info.ma50 && info.currentPrice < info.ma200) downs.push(symbol);
    }
    return { ups, downs };
  };

  const { ups, downs } = getRecommendations();
  const symbolToShow = selectedSymbol || (trades.length > 0 ? trades[0].sym : null);

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

      <div style={{ marginTop: '1rem' }}>
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

      {symbolToShow && stockInfo[symbolToShow] && (
        <div className="technical-analysis">
          <h3>📈 التحليل الفني لسهم {symbolToShow}</h3>

          <div className="indicators-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
            {[
              ["🔺 أعلى سعر 52 أسبوع", "week52High"],
              ["🔻 أدنى سعر 52 أسبوع", "week52Low"],
              ["📊 متوسط 50 يوم", "ma50"],
              ["📊 متوسط 200 يوم", "ma200"],
              ["📊 متوسط 35 يوم", "ma35"],
              ["📊 متوسط 360 يوم", "ma360"],
              ["💲 السعر الحالي", "currentPrice"]
            ].map(([label, key]) => (
              <StockCard
                key={key}
                label={label}
                value={stockInfo[symbolToShow]?.[key] ?? '...'}
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

      {symbolToShow && <TradingViewChart symbol={symbolToShow} />}

      <div style={{ marginTop: '2rem' }}>
        <h3>📈 الأسهم المرشحة للصعود</h3>
        <div>{ups.length > 0 ? ups.join(", ") : "لا يوجد حالياً"}</div>

        <h3 style={{ marginTop: '1rem' }}>📉 الأسهم المرشحة للهبوط</h3>
        <div>{downs.length > 0 ? downs.join(", ") : "لا يوجد حالياً"}</div>

        <h3 style={{ marginTop: '2rem' }}>🚀 الأسهم الأكثر ارتفاعاً عن أدنى مستوى 52 أسبوع</h3>
        <ul>
          {getTopGainers().map(item => (
            <li key={item.symbol}>
              {item.symbol} - {item.changePercent.toFixed(2)}%
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default BigTradesTracker;
