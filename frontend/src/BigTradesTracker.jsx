import './BigTradesTrackerNew.css';
import React, { useEffect, useState } from 'react';
import TradingViewChartNew from './TradingViewChartNew';

function BigTradesTrackerNew() {
  const [trades, setTrades] = useState([]);
  const [stockInfo, setStockInfo] = useState({});
  const [useMock, setUseMock] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(null);

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
            console.error("Failed fetching stock info:", err);
          }
        }
      }
    };

    socket.onerror = (err) => console.error("WebSocket Error:", err);
    socket.onclose = () => console.log("WebSocket closed");

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
useEffect(() => {
  if (!selectedSymbol && Object.keys(stockInfo).length > 0) {
    const firstSymbol = Object.keys(stockInfo)[0];
    setSelectedSymbol(firstSymbol);
  }
}, [stockInfo, selectedSymbol]);
// تحديد رمز افتراضي بمجرد تحميل بيانات السهم
useEffect(() => {
  if (!selectedSymbol && Object.keys(stockInfo).length > 0) {
    const firstSymbol = Object.keys(stockInfo)[0];
    setSelectedSymbol(firstSymbol);
  }
}, [stockInfo, selectedSymbol]);

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
        📊 {useMock ? "Mock Big Trades" : "Big Stock Trades"}
      </h2>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <div className="sidebar">
          <h4>🧾 Stock List</h4>
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

        <div className="table-container">
          <table className="trades-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Price</th>
                <th>Volume</th>
                <th>Value</th>
                <th>Time</th>
                <th>Side</th>
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
                  <td>{new Date(trade.timestamp).toLocaleTimeString('en-US')}</td>
                  <td>{trade.side}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ margin: '1rem 0' }}>
        <label htmlFor="stock-select">Select Stock:</label>
        <select
          id="stock-select"
          value={selectedSymbol || ""}
          onChange={(e) => setSelectedSymbol(e.target.value)}
          style={{ marginRight: '1rem', padding: '0.3rem', minWidth: '150px' }}
        >
          <option value="" disabled>Select a symbol</option>
          {Object.keys(stockInfo).map((symbol) => (
            <option key={symbol} value={symbol}>{symbol}</option>
          ))}
        </select>
      </div>

      {selectedSymbol && stockInfo[selectedSymbol] && (
        <>
          <h3>📈 Technical Analysis for {selectedSymbol}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
            {[
              ["52 Week High", "week52High"],
              ["52 Week Low", "week52Low"],
              ["50 Day MA", "ma50"],
              ["200 Day MA", "ma200"],
              ["35 Day MA", "ma35"],
              ["360 Day MA", "ma360"],
              ["Current Price", "currentPrice"]
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
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{stockInfo[selectedSymbol][key]}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedSymbol && <TradingViewChartNew symbol={selectedSymbol} />}

      <div style={{ marginTop: '2rem' }}>
        <h3>📈 Recommended Stocks to Buy</h3>
        <div>{ups.length > 0 ? ups.join(", ") : "None currently"}</div>

        <h3 style={{ marginTop: '1rem' }}>📉 Recommended Stocks to Sell</h3>
        <div>{downs.length > 0 ? downs.join(", ") : "None currently"}</div>
      </div>
    </div>
  );
}

export default BigTradesTrackerNew;
