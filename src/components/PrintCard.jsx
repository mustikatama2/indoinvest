// src/components/PrintCard.jsx
// Snapshot card — hidden on screen, revealed on print (window.print())
// Contains a self-contained summary card with branding, probs, macro health, prices.

import React from 'react';
import { TICKERS, SCENARIOS, S_COLORS, computeProbs, computeHealthScore, healthLabel, MACRO_INDICATORS, getZone } from '../lib/indicators.js';

export function PrintCard({ values, ticker, lastUpdate }) {
  if (!values) return null;

  const probs  = computeProbs(values, ticker);
  const health = computeHealthScore(values);
  const hl     = healthLabel(health);
  const date   = lastUpdate ? new Date(lastUpdate).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : 'No date';

  // Top macro values to display
  const macroRows = [
    { label:'IDR/USD',       val: (values.fx||0).toLocaleString(), id:'fx' },
    { label:'BI Rate',       val: `${values.biRate||0}%`,          id:'biRate' },
    { label:'10Y SBN Yield', val: `${values.sbn10y||0}%`,          id:'sbn10y' },
    { label:'Oil (Brent)',   val: `$${values.oil||0}`,             id:'oil' },
    { label:'IHSG',          val: (values.ihsg||0).toLocaleString(),id:'ihsg' },
    { label:'Foreign Flow',  val: `Rp ${values.foreignFlow||0}T`,  id:'foreignFlow' },
  ];

  return (
    <div className="print-card" style={{
      display:'none', /* hidden on screen — CSS shows it on print */
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: '#fff',
      color: '#111',
      padding: '24px 28px',
      maxWidth: 520,
      borderRadius: 12,
      border: '1px solid #ddd',
    }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, paddingBottom:12, borderBottom:'1px solid #eee' }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.5px' }}>
            <span style={{ color:'#d4a000' }}>Indo</span>Invest
          </div>
          <div style={{ fontSize:10, color:'#888', marginTop:2 }}>Indonesian Bank Monitor</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:12, fontWeight:600 }}>Snapshot: {ticker}</div>
          <div style={{ fontSize:10, color:'#888', marginTop:2 }}>{date}</div>
        </div>
      </div>

      {/* Macro health */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, padding:'10px 12px', background:'#f9f9f9', borderRadius:8 }}>
        <div style={{ width:36, height:36, borderRadius:'50%', background:`conic-gradient(${hl.color} ${health*3.6}deg, #ddd 0deg)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <div style={{ width:24, height:24, borderRadius:'50%', background:'#f9f9f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:10, fontWeight:700, color:hl.color }}>{health}</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:hl.color }}>{hl.label}</div>
          <div style={{ fontSize:10, color:'#888' }}>Macro health score (100 = fully constructive)</div>
        </div>
      </div>

      {/* Scenario probabilities */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:10, fontWeight:600, color:'#888', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Scenario Probabilities — {ticker}</div>
        <div style={{ display:'flex', gap:4 }}>
          {SCENARIOS.map((s, i) => (
            <div key={s} style={{ flex:1, textAlign:'center', padding:'6px 4px', background:`${S_COLORS[i]}10`, borderRadius:6, border:`1px solid ${S_COLORS[i]}30` }}>
              <div style={{ fontSize:18, fontWeight:700, color:S_COLORS[i] }}>{probs[i]}%</div>
              <div style={{ fontSize:8, color:S_COLORS[i], lineHeight:1.3, marginTop:2 }}>{s.split(' ')[0]}</div>
            </div>
          ))}
        </div>
        {/* Prob bar */}
        <div style={{ display:'flex', height:5, borderRadius:3, overflow:'hidden', marginTop:6 }}>
          {probs.map((p, i) => <div key={i} style={{ flex:p, background:S_COLORS[i] }} />)}
        </div>
      </div>

      {/* All ticker prices */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:10, fontWeight:600, color:'#888', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Current Prices</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {TICKERS.map(t => {
            const pk = t.toLowerCase() + 'Price';
            const p  = values[pk] || 0;
            return (
              <div key={t} style={{
                padding:'4px 10px', background: t===ticker ? '#f5f0dc' : '#f5f5f5',
                borderRadius:6, border: t===ticker ? '1.5px solid #d4a000' : '1px solid #eee',
              }}>
                <div style={{ fontSize:9, color:'#888', fontWeight:600 }}>{t}</div>
                <div style={{ fontSize:13, fontWeight:700 }}>Rp {p.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Macro table */}
      <div>
        <div style={{ fontSize:10, fontWeight:600, color:'#888', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>Key Macro Indicators</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 12px' }}>
          {macroRows.map(r => {
            const ind = MACRO_INDICATORS.find(i => i.id === r.id);
            const z   = ind ? getZone(ind, values[r.id]) : null;
            return (
              <div key={r.id} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', borderBottom:'1px solid #f0f0f0' }}>
                <span style={{ fontSize:10, color:'#555' }}>{r.label}</span>
                <span style={{ fontSize:10, fontWeight:600, color: z ? z.color : '#111' }}>{r.val}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop:16, paddingTop:10, borderTop:'1px solid #eee', fontSize:9, color:'#bbb', lineHeight:1.6 }}>
        Generated by IndoInvest · indoinvest.vercel.app · Not financial advice.
      </div>
    </div>
  );
}
