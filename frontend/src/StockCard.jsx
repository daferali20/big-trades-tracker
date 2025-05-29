import React from 'react';

function StockCard({ label, value, highlight }) {
  return (
    <div
      className="indicator-card"
      style={{
        background: '#f9f9f9',
        padding: '1rem',
        borderRadius: '10px',
        minWidth: '150px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        textAlign: 'center',
        transition: 'transform 0.2s',
        color: highlight,
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <div style={{ fontSize: '0.9rem', color: '#666' }}>{label}</div>
      <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
        {typeof value === 'number' ? value.toFixed(2) : value}
      </div>
    </div>
  );
}

export default StockCard;
