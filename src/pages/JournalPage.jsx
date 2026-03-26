// src/pages/JournalPage.jsx
// Trading journal — shows all saved snapshots with notes, full history view.

import React, { useState, useEffect } from 'react';
import { loadSnapshots } from '../lib/db.js';
import { TICKERS, S_COLORS, computeProbs, computeHealthScore, healthLabel } from '../lib/indicators.js';

function ProbMini({ probs }) {
  return (
    <div style={{ display:'flex', gap:1 }}>
      {probs.map((p, i) => (
        <span key={i} style={{ fontSize:9, color:S_COLORS[i], fontWeight:600, minWidth:18, textAlign:'center' }}>
          {p}%
        </span>
      ))}
    </div>
  );
}

function HealthBadge({ score }) {
  const hl = healthLabel(score);
  return (
    <span style={{
      fontSize:9, fontWeight:700, color:hl.color,
      background: hl.color+'18', border:`1px solid ${hl.color}30`,
      borderRadius:3, padding:'1px 5px',
    }}>{score}</span>
  );
}

function EntryRow({ entry, expanded, onToggle, activeTicker }) {
  const ts      = entry.created_at || entry.date;
  const date    = ts ? new Date(ts) : null;
  const probs   = entry.probs?.[activeTicker]
    ?? (entry.values ? computeProbs(entry.values, activeTicker) : null);
  const health  = entry.values ? computeHealthScore(entry.values) : null;
  const hasNote = !!entry.note;

  return (
    <>
      <div
        onClick={onToggle}
        style={{
          display:'grid',
          gridTemplateColumns:'80px 1fr 44px 120px 28px',
          gap:6, alignItems:'center',
          padding:'8px 10px', cursor:'pointer',
          borderBottom:'1px solid #1e1e1e',
          background: expanded ? '#1e1e1e' : 'transparent',
          transition:'background .1s',
        }}
      >
        {/* Date */}
        <div style={{ fontSize:11, color:'#8a8a8a' }}>
          {date ? date.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'}) : '—'}
          <div style={{ fontSize:9, color:'#444' }}>
            {date ? date.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : ''}
          </div>
        </div>

        {/* Note preview */}
        <div style={{ fontSize:11, color: hasNote ? '#e4e4e4' : '#444', lineHeight:1.3 }}>
          {hasNote
            ? <><span style={{ fontSize:9, marginRight:4 }}>📝</span>{entry.note}</>
            : <span style={{ fontStyle:'italic' }}>Auto snapshot</span>
          }
        </div>

        {/* Health */}
        <div>
          {health !== null && <HealthBadge score={health} />}
        </div>

        {/* Prob mini */}
        <div>
          {probs && <ProbMini probs={probs} />}
        </div>

        {/* Expand arrow */}
        <div style={{ fontSize:10, color:'#555', textAlign:'center', transform:expanded?'rotate(90deg)':'none', transition:'transform .1s' }}>▶</div>
      </div>

      {/* Expanded detail */}
      {expanded && entry.values && (
        <div style={{
          padding:'10px 14px 12px', background:'#181818',
          borderBottom:'1px solid #1e1e1e',
        }}>
          {/* Prices */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
            {TICKERS.map(t => {
              const pk = t.toLowerCase()+'Price';
              const p  = entry.values[pk];
              if (!p) return null;
              return (
                <div key={t} style={{
                  padding:'3px 8px', borderRadius:4,
                  background: t===activeTicker ? 'rgba(240,194,0,0.08)' : '#1c1c1c',
                  border: `1px solid ${t===activeTicker ? '#f0c200aa' : '#2a2a2a'}`,
                }}>
                  <span style={{ fontSize:9, color:'#555', marginRight:4 }}>{t}</span>
                  <span style={{ fontSize:11, fontWeight:600, color:'#e4e4e4' }}>Rp {p.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
          {/* Key macro */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {[
              { k:'fx',          l:'IDR/USD',     fmt: v => v.toLocaleString() },
              { k:'biRate',      l:'BI Rate',      fmt: v => `${v}%` },
              { k:'sbn10y',      l:'SBN 10Y',     fmt: v => `${v}%` },
              { k:'foreignFlow', l:'Foreign Flow', fmt: v => `Rp ${v}T` },
              { k:'oil',         l:'Oil',          fmt: v => `$${v}` },
              { k:'ihsg',        l:'IHSG',         fmt: v => v.toLocaleString() },
            ].map(({ k, l, fmt }) => {
              const v = entry.values[k];
              if (v == null) return null;
              return (
                <div key={k} style={{ fontSize:10, color:'#8a8a8a' }}>
                  {l}: <span style={{ color:'#e4e4e4', fontWeight:600 }}>{fmt(v)}</span>
                </div>
              );
            })}
          </div>
          {/* Data source badge */}
          {entry.data_source && (
            <div style={{ marginTop:6, fontSize:9, color:'#444' }}>
              Source: <span style={{ color: entry.data_source==='auto' ? '#1E8449' : '#2874A6' }}>
                {entry.data_source}
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function JournalPage() {
  const [entries, setEntries]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');   // 'all' | 'notes'
  const [activeTicker, setActive] = useState('BBCA');
  const [expanded, setExpanded]   = useState(null);

  useEffect(() => {
    loadSnapshots(200).then(snaps => {
      setEntries([...snaps].reverse()); // newest first
      setLoading(false);
    });
  }, []);

  const filtered = filter === 'notes'
    ? entries.filter(e => e.note)
    : entries;

  const noteCount = entries.filter(e => e.note).length;

  return (
    <div style={{ padding:'4px 0' }}>
      {/* Header controls */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'#e4e4e4' }}>Trading Journal</div>
          <div style={{ fontSize:10, color:'#555' }}>
            {entries.length} snapshots · {noteCount} with notes
          </div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          {/* Filter */}
          {[['all','All'],['notes','Notes only']].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              fontSize:11, padding:'4px 10px', borderRadius:4, cursor:'pointer',
              background: filter===k ? '#242424' : 'transparent',
              color: filter===k ? '#e4e4e4' : '#555',
              border:`1px solid ${filter===k ? '#444' : '#2a2a2a'}`,
            }}>{l}</button>
          ))}
          {/* Active ticker for prob display */}
          <select value={activeTicker} onChange={e => setActive(e.target.value)} style={{
            fontSize:11, padding:'4px 6px', background:'#1c1c1c', color:'#8a8a8a',
            border:'1px solid #2a2a2a', borderRadius:4,
          }}>
            {TICKERS.map(t => <option key={t} value={t}>{t} probs</option>)}
          </select>
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display:'grid', gridTemplateColumns:'80px 1fr 44px 120px 28px',
        gap:6, padding:'4px 10px', marginBottom:2,
      }}>
        {['Date','Note / Snapshot','Health','V · G · S · B · C',''].map((h, i) => (
          <div key={i} style={{ fontSize:9, fontWeight:600, color:'#444', textTransform:'uppercase', letterSpacing:0.4 }}>{h}</div>
        ))}
      </div>

      {/* Entries */}
      <div style={{ background:'#1c1c1c', borderRadius:8, border:'1px solid #2a2a2a', overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:'24px', textAlign:'center', color:'#555', fontSize:12 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:'24px', textAlign:'center', color:'#555', fontSize:12 }}>
            {filter === 'notes' ? 'No notes yet — add one when saving a snapshot.' : 'No snapshots yet — hit ⚡ Live fetch in Dashboard.'}
          </div>
        ) : (
          filtered.map((entry, i) => (
            <EntryRow
              key={entry.id || (entry.date + i)}
              entry={entry}
              expanded={expanded === i}
              onToggle={() => setExpanded(expanded === i ? null : i)}
              activeTicker={activeTicker}
            />
          ))
        )}
      </div>

      <div style={{ fontSize:10, color:'#444', marginTop:10, lineHeight:1.6 }}>
        Snapshots are saved every ⚡ Live fetch + every manual 💾 save. Tap any row to expand.
      </div>
    </div>
  );
}
