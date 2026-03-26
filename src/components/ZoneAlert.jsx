import React from 'react';

/**
 * Dismissable banner for zone-crossing alerts.
 * Props: alerts (array of {ticker, field, from, to, color}), onDismiss
 */
export function ZoneAlert({ alerts, onDismiss }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div
      style={{
        background: '#1c1c1c',
        border: '1px solid #444',
        borderLeft: '3px solid #f0c200',
        borderRadius: 6,
        padding: '8px 12px',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      <div style={{ flex: 1 }}>
        {alerts.map((a, i) => (
          <div key={i} style={{ fontSize: 12, color: '#e4e4e4', lineHeight: '1.6' }}>
            ⚡{' '}
            <strong>{a.ticker}</strong>
            {a.field ? ` (${a.field})` : ''} moved from{' '}
            <span style={{ color: '#8a8a8a' }}>{a.from}</span>
            {' → '}
            <span style={{ color: a.color || '#f0c200', fontWeight: 600 }}>{a.to}</span>
          </div>
        ))}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#8a8a8a',
            fontSize: 16,
            cursor: 'pointer',
            padding: 0,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
