import React, { useState } from 'react';

const ZONE_CONFIG = {
  'Aggr. Buy': { tranches: [3, 4], weeks: '4–6 weeks', action: 'buy', pct: 1.0 },
  'Accumulate': { tranches: [2, 3], weeks: '4–8 weeks', action: 'buy', pct: 0.5 },
  'Fair':       { tranches: null,   weeks: null,         action: 'hold', pct: 0 },
  'Full':       { tranches: null,   weeks: null,         action: 'trim', pct: 0.15 },
};

export function PositionCalc({ ticker, currentPrice, zone, onClose }) {
  const [portfolio, setPortfolio] = useState(10_000_000);
  const cfg = ZONE_CONFIG[zone] || ZONE_CONFIG['Fair'];

  const card = {
    background: '#1c1c1c',
    border: '1px solid #333',
    borderRadius: 8,
    padding: 16,
    color: '#e4e4e4',
    minWidth: 260,
    fontSize: 13,
    position: 'relative',
  };

  const renderAdvice = () => {
    if (cfg.action === 'hold') {
      return <p style={{ color: '#8a8a8a', marginTop: 10 }}>Hold. Max position already.</p>;
    }
    if (cfg.action === 'trim') {
      const trimAmt = Math.round(portfolio * 0.15);
      return (
        <p style={{ marginTop: 10 }}>
          Consider trimming 10–20%.<br />
          <span style={{ color: '#f0c200', fontWeight: 600 }}>
            ≈ Rp {trimAmt.toLocaleString('id-ID')}
          </span> to sell.
        </p>
      );
    }
    const [lo, hi] = cfg.tranches;
    const deployAmt = Math.round(portfolio * cfg.pct);
    const perLo = Math.round(deployAmt / hi);
    const perHi = Math.round(deployAmt / lo);
    return (
      <div style={{ marginTop: 10 }}>
        <p style={{ color: '#8a8a8a', marginBottom: 6 }}>
          Deploy in {lo}–{hi} tranches over {cfg.weeks}:
        </p>
        <p style={{ color: '#f0c200', fontWeight: 600 }}>
          Rp {perLo.toLocaleString('id-ID')} – {perHi.toLocaleString('id-ID')} / tranche
        </p>
      </div>
    );
  };

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>{ticker} Position Calc</strong>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8a8a8a', fontSize: 16, cursor: 'pointer' }}>×</button>
      </div>
      <p style={{ color: '#8a8a8a', fontSize: 11, marginTop: 2 }}>
        Zone: <span style={{ color: '#e4e4e4' }}>{zone}</span>
        {currentPrice ? ` · Price: Rp ${currentPrice.toLocaleString('id-ID')}` : ''}
      </p>
      <div style={{ marginTop: 10 }}>
        <label style={{ fontSize: 11, color: '#8a8a8a' }}>My portfolio (Rp)</label>
        <input
          type="number"
          value={portfolio}
          onChange={e => setPortfolio(Number(e.target.value) || 0)}
          style={{ display: 'block', width: '100%', marginTop: 4, background: '#202020', color: '#e4e4e4', border: '1px solid #333', borderRadius: 4, padding: '4px 8px', fontSize: 13 }}
        />
      </div>
      {renderAdvice()}
    </div>
  );
}
