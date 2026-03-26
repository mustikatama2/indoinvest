// src/components/AlertManager.jsx
// Price alert setup UI — per ticker target + direction toggle

import React, { useState } from 'react';
import { TICKERS } from '../lib/indicators.js';

export function AlertManager({ alerts, setAlert, removeAlert, permission, requestPerm, currentValues }) {
  const [open, setOpen] = useState(false);

  const activeCount = Object.values(alerts).filter(a => a?.enabled).length;

  return (
    <div style={{ marginBottom: 10 }}>
      {/* Toggle button */}
      <button onClick={() => setOpen(o => !o)} style={{
        fontSize:11, padding:'5px 10px', borderRadius:6, cursor:'pointer',
        background: activeCount > 0 ? 'rgba(240,194,0,0.08)' : 'transparent',
        color: activeCount > 0 ? '#f0c200' : '#8a8a8a',
        border:`1px solid ${activeCount > 0 ? '#f0c200aa' : '#2a2a2a'}`,
        display:'flex', alignItems:'center', gap:5,
      }}>
        🔔 Alerts {activeCount > 0 && <span style={{ fontSize:10, fontWeight:700 }}>({activeCount})</span>}
        <span style={{ fontSize:9, color:'inherit', opacity:0.7 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          marginTop:8, padding:12, background:'#1c1c1c', borderRadius:8,
          border:'1px solid #2a2a2a',
        }}>
          {/* Permission banner */}
          {permission !== 'granted' && (
            <div style={{
              fontSize:11, color:'#D35400', background:'rgba(211,84,0,0.08)',
              border:'1px solid rgba(211,84,0,0.2)', borderRadius:5,
              padding:'6px 10px', marginBottom:10, display:'flex',
              justifyContent:'space-between', alignItems:'center',
            }}>
              <span>⚠ Notifications blocked — alerts won't fire</span>
              <button onClick={requestPerm} style={{
                fontSize:11, color:'#D35400', background:'none', border:'none', cursor:'pointer', textDecoration:'underline',
              }}>Enable</button>
            </div>
          )}

          {/* Per-ticker rows */}
          {TICKERS.map(ticker => {
            const pk      = ticker.toLowerCase() + 'Price';
            const current = currentValues?.[pk] || 0;
            const alert   = alerts[ticker] || {};

            return (
              <div key={ticker} style={{
                display:'grid', gridTemplateColumns:'52px 1fr 72px 56px 28px',
                gap:6, alignItems:'center', marginBottom:6,
              }}>
                {/* Ticker label */}
                <div style={{ fontSize:12, fontWeight:600, color:'#e4e4e4' }}>{ticker}</div>

                {/* Target price input */}
                <input
                  type="number"
                  placeholder={`Target (now ${current.toLocaleString()})`}
                  value={alert.target ?? ''}
                  onChange={e => setAlert(ticker, { target: parseFloat(e.target.value) || null })}
                  style={{
                    fontSize:11, padding:'4px 6px', borderRadius:4, width:'100%',
                    background:'#141414', color:'#e4e4e4', border:'1px solid #333',
                  }}
                />

                {/* Direction toggle */}
                <select
                  value={alert.direction ?? 'below'}
                  onChange={e => setAlert(ticker, { direction: e.target.value })}
                  style={{ fontSize:10, padding:'4px 4px', background:'#141414', color:'#8a8a8a', border:'1px solid #333', borderRadius:4 }}
                >
                  <option value="below">≤ price</option>
                  <option value="above">≥ price</option>
                </select>

                {/* Enable toggle */}
                <button
                  onClick={() => setAlert(ticker, { enabled: !alert.enabled })}
                  disabled={!alert.target}
                  style={{
                    fontSize:10, padding:'4px 6px', borderRadius:4, cursor: alert.target ? 'pointer' : 'not-allowed',
                    background: alert.enabled ? 'rgba(30,132,73,0.15)' : 'transparent',
                    color: alert.enabled ? '#2ecc71' : '#555',
                    border:`1px solid ${alert.enabled ? 'rgba(30,132,73,0.3)' : '#2a2a2a'}`,
                    fontWeight: 600,
                  }}
                >
                  {alert.enabled ? 'ON' : 'OFF'}
                </button>

                {/* Remove */}
                <button
                  onClick={() => removeAlert(ticker)}
                  title="Clear alert"
                  style={{ fontSize:12, color:'#555', background:'none', border:'none', cursor:'pointer', padding:0 }}
                >×</button>
              </div>
            );
          })}

          <div style={{ fontSize:10, color:'#444', marginTop:6, lineHeight:1.5 }}>
            Alerts fire when ⚡ Live fetch crosses your target. Keep the tab open.
          </div>
        </div>
      )}
    </div>
  );
}
