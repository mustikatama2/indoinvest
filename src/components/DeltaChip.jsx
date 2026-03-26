import React from 'react';

/**
 * Shows price/pct change vs a previous value.
 * Props: current, previous, format ('price' | 'pct' | 'both')
 */
export function DeltaChip({ current, previous, format = 'both' }) {
  if (previous == null || previous === current) return null;

  const diff = current - previous;
  const pct = (diff / Math.abs(previous)) * 100;
  const positive = diff > 0;
  const color = positive ? '#4ade80' : '#f87171';
  const sign = positive ? '+' : '';

  const priceStr = `${sign}${diff.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
  const pctStr = `${sign}${pct.toFixed(1)}%`;

  let label;
  if (format === 'price') label = priceStr;
  else if (format === 'pct') label = pctStr;
  else label = `${priceStr} (${pctStr})`;

  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 11,
        fontWeight: 600,
        color,
        background: positive ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
        border: `1px solid ${positive ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
        borderRadius: 4,
        padding: '1px 5px',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
