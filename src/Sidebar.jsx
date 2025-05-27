import React from "react";

function Sidebar() {
  const symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"];
  return (
    <div className="w-64 bg-white shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4">🧾 قائمة الأسهم</h2>
      <ul className="space-y-2">
        {symbols.map((symbol) => (
          <li key={symbol} className="cursor-pointer hover:text-blue-600">
            {symbol}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;