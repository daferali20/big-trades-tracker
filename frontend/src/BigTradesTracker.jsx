import React from 'react';

function TradesTable({ trades }) {
  return (
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
            <tr key={index} className={trade.side === "Buy" ? "trade-buy" : "trade-sell"}>
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
  );
}

export default TradesTable;
