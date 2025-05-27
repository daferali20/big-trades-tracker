import React from 'react';

function TradingViewChart({ symbol }) {
  if (!symbol) return null;

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>📉 الشارت اللحظي لسهم {TSLA}</h3>
      <div style={{ height: '500px', width: '100%' }}>
        <iframe
          src={`https://s.tradingview.com/widgetembed/?symbol=NASDAQ:${symbol}&interval=5&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=F1F3F6&studies=[]&theme=light&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1&hide_side_toolbar=1`}
          width="100%"
          height="100%"
          frameBorder="0"
          allowTransparency="true"
          scrolling="no"
          title="TradingView Chart"
        ></iframe>
      </div>
    </div>
  );
}

export default TradingViewChart;
