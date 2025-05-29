import './BigTradesTracker.css';
import React, { useEffect, useState } from 'react';
import TradingViewChart from './TradingViewChart';
import StockCard from './StockCard';
import TradesTable from './TradesTable';
const apiKey = "YOUR_POLYGON_API_KEY";

function BigTradesTracker() {
  // 1. تعريف الحالات (States)
  const [trades, setTrades] = useState([]); // تخزين الصفقات
  const [stockInfo, setStockInfo] = useState({}); // معلومات الأسهم
  const [selectedSymbol, setSelectedSymbol] = useState('TSLA'); // السهم المحدد
  const [loading, setLoading] = useState(false); // حالة التحميل
  const [error, setError] = useState(null); // الأخطاء

  // 2. دالة جلب بيانات السهم من Polygon.io
  const fetchStockInfo = async (symbol) => {
    try {
      setLoading(true);
      setError(null);
      
      // جلب البيانات الأساسية من API Polygon
      const [tickerRes, lastTradeRes, ma50Res, ma200Res] = await Promise.all([
  fetch(`https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${apiKey}`),
  fetch(`https://api.polygon.io/v2/last/trade/${symbol}?apiKey=${apiKey}`),
  fetch(`https://api.polygon.io/v1/indicators/sma/${symbol}?timespan=day&window=50&series_type=close&order=desc&limit=1&adjusted=true&apiKey=${apiKey}`),
  fetch(`https://api.polygon.io/v1/indicators/sma/${symbol}?timespan=day&window=200&series_type=close&order=desc&limit=1&adjusted=true&apiKey=${apiKey}`)
]);

      // معالجة البيانات المستلمة
      const [tickerData, lastTrade, ma50, ma200] = await Promise.all([
        tickerRes.json(),
        lastTradeRes.json(),
        ma50Res.json(),
        ma200Res.json()
      ]);

      // إرجاع البيانات بشكل منظم
      return {
        symbol,
        name: tickerData.results?.name || '',
        currentPrice: lastTrade.results?.p || 0,
        week52High: tickerData.results?.week52High || 0,
        week52Low: tickerData.results?.week52Low || 0,
        ma50: ma50.results?.values[0]?.value || 0,
        ma200: ma200.results?.values[0]?.value || 0,
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

  // 3. useEffect لجلب البيانات الأولية وتكوين اتصال WebSocket
  useEffect(() => {
    // جلب بيانات TSLA عند التحميل الأولي
    const loadInitialData = async () => {
      const tslaData = await fetchStockInfo('TSLA');
      if (tslaData) {
        setStockInfo(prev => ({ ...prev, TSLA: tslaData }));
      }
    };
    loadInitialData();

    // تكوين اتصال WebSocket للصفقات الحية
    const socket = new WebSocket("wss://delayed.polygon.io/stocks");
    
    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      // معالجة الصفقات الكبيرة فقط (قيمة 500$ فأكثر)
      if (data.price * data.volume >= 1000) {
         setTrades(prev => [data, ...prev.slice(0, 49)]);} // تحديث قائمة الصفقات

        // جلب بيانات السهم إذا لم تكن موجودة
      if (!Object.keys(stockInfoRef.current).includes(data.symbol)) {
  const newStockData = await fetchStockInfo(data.symbol);
if (newStockData) {
            setStockInfo(prev => ({ ...prev, [data.symbol]: newStockData }));
}
                  }
        }
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket Error:", err);
      setError("فقدان الاتصال بخادم الصفقات الحية");
    };
    
    socket.onclose = () => console.log("❌ تم إغلاق اتصال WebSocket");
//الاسهم الاكثر ارتفاعا
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
<div style={{ marginTop: '2rem' }}>
  <h3>🚀 الأسهم الأكثر ارتفاعاً عن أدنى مستوى 52 أسبوع</h3>
  <ul>
    {getTopGainers().map(item => (
      <li key={item.symbol}>
        {item.symbol} - {item.changePercent.toFixed(2)}%
      </li>
    ))}
  </ul>
</div>
    return () => {
      socket.close(); // تنظيف الاتصال عند إلغاء التثبيت
    };
  }, [ ]);


  // 4. دالة تحليل التوصيات
  const getRecommendations = () => {
    const ups = [], downs = [];
    for (const [symbol, info] of Object.entries(stockInfo)) {
      // تحديد الأسهم الصاعدة (السعر فوق المتوسطات)
      if (info.currentPrice > info.ma50 && info.currentPrice > info.ma200) ups.push(symbol);
      // تحديد الأسهم الهابطة (السعر تحت المتوسطات)
      if (info.currentPrice < info.ma50 && info.currentPrice < info.ma200) downs.push(symbol);
    }
    return { ups, downs };
  };

  const { ups, downs } = getRecommendations();
  const symbolToShow = selectedSymbol || (trades.length > 0 ? trades[0].symbol : null);

  // 5. واجهة المستخدم
  return (
    <div className="big-trades-container">
      {/* مؤشر التحميل ورسائل الخطأ */}
      {loading && <div className="loading-indicator">جاري تحميل البيانات...</div>}
      {error && <div className="error-message">{error}</div>}

      {/* عنوان الصفحة */}
      <h2 style={{ textAlign: 'center' }}>📊 الصفقات الكبيرة للأسهم</h2>

      {/* القسم الرئيسي - قائمة الأسهم وجدول الصفقات */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        {/* الشريط الجانبي - قائمة الأسهم */}
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
                  <td>{trade.price.toFixed(2)}</td>
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

      {/* اختيار السهم لعرض التفاصيل */}
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

      {/* قسم التحليل الفني */}
      {symbolToShow && (
        <div className="technical-analysis">
          <h3>📈 التحليل الفني لسهم {symbolToShow}</h3>
          
          {loading ? (
            <div className="loading-indicator">
              <p>جاري تحميل البيانات...</p>
            </div>
          ) : (
            stockInfo[symbolToShow] && (
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
      value={stockInfo[symbolToShow][key]}
      highlight={
        key === 'currentPrice'
          ? (stockInfo[symbolToShow][key] > stockInfo[symbolToShow].ma50 ? '#2ecc71' : '#e74c3c')
          : undefined
      }
    />
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

      {/* مخطط TradingView */}
      {symbolToShow && (
        <TradingViewChart symbol={symbolToShow} />
      )}

      {/* قسم التوصيات */}
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
