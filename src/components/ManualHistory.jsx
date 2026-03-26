// src/components/ManualHistory.jsx
// Shows when each manual field was last changed, with a collapsible change log.

import React, { useState, useEffect } from 'react';
import { MANUAL_FIELDS, MANUAL_HINTS } from '../lib/indicators.js';

const FIELD_LABELS = {
  biRate:      'BI Rate',
  sbn10y:      '10Y SBN Yield',
  foreignFlow: 'Foreign Net Flow',
  moodys:      "Moody's Status",
};

function timeAgo(isoString) {
  if (!isoString) return '—';
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.round(diff/60)}m ago`;
  if (diff < 86400) return `${Math.round(diff/3600)}h ago`;
  return `${Math.round(diff/86400)}d ago`;
}

function formatVal(fieldId, val) {
  if (val == null) return '—';
  if (fieldId === 'moodys') {
    const labels = ['Baa2 stable','Baa2 negative','Baa3 stable','Baa3 negative','Sub-IG'];
    return labels[val] || `Option ${val}`;
  }
  if (fieldId === 'foreignFlow') return `Rp ${val}T`;
  if (fieldId === 'biRate' || fieldId === 'sbn10y') return `${val}%`;
  return String(val);
}

export function ManualHistory({ currentValues }) {
  const [open, setOpen]         = useState(false);
  const [history, setHistory]   = useState({});  // { fieldId: [rows] }
  const [loading, setLoading]   = useState(false);
  const [manualMeta, setMeta]   = useState(null); // { field_id: { value, updated_at } }

  // Load field metadata (updated_at) from API
  useEffect(() => {
    fetch('/api/manual-values')
      .then(r => r.json())
      .then(({ rows }) => {
        if (!rows) return;
        const meta = {};
        rows.forEach(r => { meta[r.field_id] = r; });
        setMeta(meta);
      })
      .catch(() => {});
  }, []);

  const loadHistory = async () => {
    if (loading) return;
    setLoading(true);
    const results = {};
    await Promise.all([...MANUAL_FIELDS].map(async (fieldId) => {
      try {
        const r = await fetch(`/api/manual-history?field_id=${fieldId}&limit=10`);
        const { rows } = await r.json();
        results[fieldId] = rows || [];
      } catch {
        results[fieldId] = [];
      }
    }));
    setHistory(results);
    setLoading(false);
  };

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && Object.keys(history).length === 0) loadHistory();
  };

  return (
    <div style={{ marginBottom:14 }}>
      <div
        onClick={handleOpen}
        style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', marginBottom: open ? 8 : 0 }}
      >
        <div style={{ fontSize:10, fontWeight:600, color:'#555', textTransform:'uppercase', letterSpacing:0.5 }}>
          Manual Indicator History
        </div>
        <span style={{ fontSize:10, color:'#555', display:'inline-block', transform:open?'rotate(90deg)':'none', transition:'transform .15s' }}>▶</span>
      </div>

      {open && (
        <div style={{ background:'#1c1c1c', borderRadius:8, border:'1px solid #2a2a2a', overflow:'hidden' }}>
          {[...MANUAL_FIELDS].map((fieldId, fi) => {
            const meta   = manualMeta?.[fieldId];
            const rows   = history[fieldId] || [];
            const isLast = fi === MANUAL_FIELDS.size - 1;

            return (
              <div key={fieldId} style={{ borderBottom: isLast ? 'none' : '1px solid #1e1e1e' }}>
                {/* Field summary row */}
                <div style={{
                  display:'grid', gridTemplateColumns:'120px 1fr auto',
                  gap:8, alignItems:'center', padding:'8px 12px',
                }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, color:'#e4e4e4' }}>{FIELD_LABELS[fieldId]}</div>
                    <div style={{ fontSize:9, color:'#444', marginTop:1 }}>{MANUAL_HINTS[fieldId]?.split(' — ')[0]}</div>
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#e4e4e4' }}>
                    {formatVal(fieldId, currentValues?.[fieldId])}
                  </div>
                  <div style={{ textAlign:'right' }}>
                    {meta?.updated_at && (
                      <div style={{ fontSize:9, color:'#555' }}>
                        Updated {timeAgo(meta.updated_at)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Change log */}
                {loading ? (
                  <div style={{ padding:'4px 12px 8px', fontSize:10, color:'#444' }}>Loading…</div>
                ) : rows.length > 0 ? (
                  <div style={{ padding:'0 12px 8px' }}>
                    {rows.map((row, i) => (
                      <div key={row.id || i} style={{
                        display:'flex', gap:8, alignItems:'center',
                        fontSize:10, color:'#555', marginTop:3,
                      }}>
                        <span style={{ color:'#333', minWidth:60 }}>
                          {new Date(row.changed_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}
                        </span>
                        {row.old_value != null && (
                          <>
                            <span style={{ color:'#C0392B' }}>{formatVal(fieldId, row.old_value)}</span>
                            <span style={{ color:'#444' }}>→</span>
                          </>
                        )}
                        <span style={{ color:'#1E8449', fontWeight:600 }}>{formatVal(fieldId, row.new_value)}</span>
                        <span style={{ color:'#333', fontSize:9 }}>{timeAgo(row.changed_at)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding:'0 12px 8px', fontSize:10, color:'#333' }}>No changes logged yet</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
