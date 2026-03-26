// src/components/CompareView.jsx
// All-ticker side-by-side comparison — "which one to buy today?"

import React, { useState, useEffect } from 'react';
import {
  TICKERS, SCENARIOS, S_COLORS,
  computeProbs, getAction, computeHealthScore, healthLabel,
} from '../lib/indicators.js';
import { loadCurrentValues, loadSnapshots } from '../lib/db.js';
import { Sparkline } from './Sparkline.jsx';
import { DeltaChip } from './DeltaChip.jsx';

function MiniProbBar({ probs }) {
  return (
    <div style={{ display:'flex', gap:1, height:6, borderRadius:3, overflow:'hidden' }}>
      {probs.map((p, i) => (
        <div key={i} style={{ flex: p, background: S_COLORS[i], minWidth: p > 0 ? 2 : 0 }} />
      ))}
    </div>
  );
}

function TickerCard({ ticker, values, sparkData, prevPrice, isTop }) {
  const probs  = computeProbs(values, ticker);
  const ai     = getAction(ticker, values);
  const pk     = ticker.toLowerCase() + 'Price';
  const price  = values[pk] || 0;
  const topScenarioIdx = probs.indexOf(Math.max(...probs));

  return (
    <div style={{
      background: isTop ? `${ai.color}12` : '#1c1c1c',
      border: `${isTop ? '2' : '1'}px solid ${isTop ? ai.color + '44' : '#2a2a2a'}`,
      borderRadius: 10,
      padding: '12px 14px',
      position: 'relative',
      flex: '1 1 160px',
      minWidth: 0,
    }}>
      {isTop && (
        <div style={{
          position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)',
          fontSize:9, fontWeight:700, color:'#111', background:'#f0c200',
          borderRadius:10, padding:'2px 8px', letterSpacing:0.5, whiteSpace:'nowrap',
        }}>BEST ENTRY</div>
      )}

      {/* Ticker + action */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:'#e4e4e4' }}>{ticker}</div>
          <div style={{
            fontSize:9, fontWeight:700, color: ai.color,
            background: ai.color + '18', border:`1px solid ${ai.color}30`,
            borderRadius:3, padding:'1px 5px', display:'inline-block', marginTop:2,
          }}>{ai.zone}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:16, fontWeight:700, color:'#e4e4e4' }}>
            {price.toLocaleString()}
          </div>
          <DeltaChip current={price} previous={prevPrice} format="pct" />
        </div>
      </div>

      {/* Sparkline */}
      {sparkData.length > 1 && (
        <div style={{ marginBottom:8 }}>
          <Sparkline data={sparkData} color={ai.color} width={140} height={28} />
        </div>
      )}

      {/* Prob bar */}
      <MiniProbBar probs={probs} />
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
        <span style={{ fontSize:9, color: S_COLORS[0] }}>{probs[0]}% bull</span>
        <span style={{ fontSize:9, color: S_COLORS[topScenarioIdx], fontWeight:600 }}>
          {SCENARIOS[topScenarioIdx].split(' ')[0]} most likely
        </span>
        <span style={{ fontSize:9, color: S_COLORS[4] }}>{probs[4]}% crisis</span>
      </div>

      {/* Action text */}
      <div style={{ fontSize:10, color:'#8a8a8a', marginTop:6, lineHeight:1.4 }}>
        {ai.action}
      </div>
    </div>
  );
}

export function CompareView({ onSelectTicker }) {
  const [values, setValues]   = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy]   = useState('zone'); // 'zone' | 'bullish' | 'price'

  useEffect(() => {
    (async () => {
      const v = loadCurrentValues();
      setValues(v);
      const snaps = await loadSnapshots(40);
      setHistory(snaps);
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div style={{ textAlign:'center', color:'#555', padding:'40px 0', fontSize:13 }}>
      Loading comparison…
    </div>
  );

  if (!values) return (
    <div style={{ textAlign:'center', color:'#555', padding:'40px 0', fontSize:13 }}>
      No data yet — go to Dashboard and hit ⚡ Live fetch first.
    </div>
  );

  const health = computeHealthScore(values);
  const hl     = healthLabel(health);

  // Sort tickers
  const sortedTickers = [...TICKERS].sort((a, b) => {
    const ai = getAction(a, values);
    const bi = getAction(b, values);
    const zoneOrder = { 'Aggr. Buy':0, 'Accumulate':1, 'Fair':2, 'Full':3, '?':4 };
    if (sortBy === 'zone')    return (zoneOrder[ai.zone]??4) - (zoneOrder[bi.zone]??4);
    if (sortBy === 'bullish') return computeProbs(values, b)[0] - computeProbs(values, a)[0];
    if (sortBy === 'price')   return (values[b.toLowerCase()+'Price']||0) - (values[a.toLowerCase()+'Price']||0);
    return 0;
  });

  const topTicker = sortedTickers[0];

  // Macro summary
  const macroSummary = [
    { label:'IDR/USD',  val: `${(values.fx||0).toLocaleString()}` },
    { label:'BI Rate',  val: `${values.biRate||0}%` },
    { label:'IHSG',     val: `${(values.ihsg||0).toLocaleString()}` },
    { label:'Oil',      val: `$${values.oil||0}` },
  ];

  return (
    <div style={{ padding:'4px 0' }}>

      {/* Macro health banner */}
      <div style={{
        display:'flex', alignItems:'center', gap:12, marginBottom:14,
        padding:'10px 14px', borderRadius:10,
        background:'#1c1c1c', border:'1px solid #2a2a2a',
      }}>
        <div style={{
          width:42, height:42, borderRadius:'50%', flexShrink:0,
          background:`conic-gradient(${hl.color} ${health*3.6}deg, #222 0deg)`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:'#1c1c1c', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:11, fontWeight:700, color:hl.color }}>{health}</span>
          </div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, fontWeight:600, color:hl.color }}>{hl.label}</div>
          <div style={{ display:'flex', gap:10, marginTop:4, flexWrap:'wrap' }}>
            {macroSummary.map(m => (
              <span key={m.label} style={{ fontSize:10, color:'#8a8a8a' }}>
                {m.label}: <span style={{ color:'#e4e4e4' }}>{m.val}</span>
              </span>
            ))}
          </div>
        </div>
        <div style={{ fontSize:10, color:'#555' }}>Macro snapshot</div>
      </div>

      {/* Sort controls */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ fontSize:10, color:'#555', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>
          All 5 Tickers — Sorted by
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {[['zone','Entry Zone'],['bullish','Bull %'],['price','Price']].map(([k,l]) => (
            <button key={k} onClick={() => setSortBy(k)} style={{
              fontSize:10, padding:'4px 8px', borderRadius:4, border:'1px solid',
              borderColor: sortBy===k ? '#444' : '#222',
              background: sortBy===k ? '#242424' : 'transparent',
              color: sortBy===k ? '#e4e4e4' : '#555',
              cursor:'pointer',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Ticker cards */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {sortedTickers.map(ticker => {
          const pk        = ticker.toLowerCase() + 'Price';
          const sparkData = history.slice(-20).map(h => h.values?.[pk]).filter(v => v > 0);
          const prev      = history.length > 1 ? history[history.length-2]?.values?.[pk] : null;
          return (
            <TickerCard
              key={ticker}
              ticker={ticker}
              values={values}
              sparkData={sparkData}
              prevPrice={prev}
              isTop={ticker === topTicker}
            />
          );
        })}
      </div>

      {/* Click to open detail */}
      <div style={{ marginTop:12 }}>
        <div style={{ fontSize:10, color:'#555', marginBottom:6 }}>Open in Dashboard →</div>
        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          {sortedTickers.map((ticker, i) => {
            const ai = getAction(ticker, values);
            return (
              <button key={ticker} onClick={() => onSelectTicker(TICKERS.indexOf(ticker))} style={{
                fontSize:12, fontWeight:600, padding:'6px 14px', borderRadius:6, cursor:'pointer',
                background: `${ai.color}18`, color: ai.color,
                border: `1px solid ${ai.color}33`,
              }}>
                {ticker}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
