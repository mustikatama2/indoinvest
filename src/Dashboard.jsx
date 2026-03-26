import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkline }        from './components/Sparkline.jsx';
import { DeltaChip }        from './components/DeltaChip.jsx';
import { PositionCalc }     from './components/PositionCalc.jsx';
import { ZoneAlert }        from './components/ZoneAlert.jsx';
import { ProbTrendChart }   from './components/ProbTrendChart.jsx';
import { SensitivityTable } from './components/SensitivityTable.jsx';
import { CatalystCalendar } from './components/CatalystCalendar.jsx';
import { SaveWithNote }     from './components/SaveWithNote.jsx';
import { useAutoRefresh }   from './hooks/useAutoRefresh.js';
import { encodeState, decodeState } from './hooks/useUrlState.js';
import { CATALYSTS, CATALYST_TYPES } from './data/catalysts.js';
import {
  EXTRA_TICKERS,
  EXTRA_BASE_PROBS,
  EXTRA_PRICE_INDICATORS,
  EXTRA_SCENARIO_DETAILS,
} from './data/extraTickers.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const TICKERS   = ['BBCA', 'BBRI', 'BMRI', ...EXTRA_TICKERS];
const SCENARIOS = ['V-shape recovery', 'Gradual grind', 'Sideways chop', 'Extended bear', 'Full crisis'];
const S_COLORS  = ['#1E8449', '#2874A6', '#D35400', '#C0392B', '#7B241C'];

const BASE_PROBS = {
  BBCA: [15, 40, 25, 15, 5],
  BBRI: [12, 35, 28, 18, 7],
  BMRI: [15, 38, 27, 15, 5],
  ...EXTRA_BASE_PROBS,
};

const AUTO_FIELDS   = new Set(['bbcaPrice','bbriPrice','bmriPrice','bbniPrice','brisPrice','ihsg','fx','oil']);
const MANUAL_FIELDS = new Set(['sbn10y','biRate','foreignFlow','moodys']);

const MANUAL_HINTS = {
  sbn10y:      'Updated daily — check DJPPR or Investing.com',
  biRate:      'Changed at RDG BI meetings (~8×/yr) — check bi.go.id',
  foreignFlow: 'Monthly IDX data — check idx.co.id/berita/statistik',
  moodys:      'Rating actions only — update on official Moody\'s announcements',
};

// ─── Indicator Definitions ────────────────────────────────────────────────────

const MACRO_INDICATORS = [
  {
    id: 'fx', name: 'IDR/USD', default: 16850, step: 50,
    thresholds: [
      { below:15500, scores:[3,1,0,0,0] }, { below:16000, scores:[2,2,0,0,0] },
      { below:16500, scores:[1,2,0,0,0] }, { below:17000, scores:[0,1,1,0,0] },
      { below:17500, scores:[0,0,1,1,0] }, { below:18000, scores:[0,0,0,2,1] },
      { below:19000, scores:[0,0,0,1,2] }, { below:99999, scores:[0,0,0,0,3] },
    ],
    zones: [
      { max:16000, label:'Bullish', color:'#1E8449' }, { max:17000, label:'Neutral', color:'#D35400' },
      { max:18000, label:'Stress',  color:'#C0392B' }, { max:99999, label:'Crisis',  color:'#7B241C' },
    ],
  },
  {
    id: 'sbn10y', name: '10Y SBN yield', default: 6.40, step: 0.05,
    thresholds: [
      { below:5.5, scores:[3,1,0,0,0] }, { below:6.0, scores:[2,2,0,0,0] },
      { below:6.5, scores:[1,1,1,0,0] }, { below:7.0, scores:[0,1,1,1,0] },
      { below:7.5, scores:[0,0,0,2,1] }, { below:8.0, scores:[0,0,0,1,2] },
      { below:99,  scores:[0,0,0,0,3] },
    ],
    zones: [
      { max:6.0, label:'Bullish', color:'#1E8449' }, { max:6.8, label:'Neutral', color:'#D35400' },
      { max:7.5, label:'Stress',  color:'#C0392B' }, { max:99,  label:'Crisis',  color:'#7B241C' },
    ],
  },
  {
    id: 'oil', name: 'Oil (Brent)', default: 97, step: 1,
    thresholds: [
      { below:70,  scores:[3,1,0,0,0] }, { below:80,  scores:[2,2,0,0,0] },
      { below:90,  scores:[1,2,1,0,0] }, { below:100, scores:[0,1,1,1,0] },
      { below:110, scores:[0,0,0,2,1] }, { below:130, scores:[0,0,0,1,2] },
      { below:999, scores:[0,0,0,0,3] },
    ],
    zones: [
      { max:80,  label:'Supportive', color:'#1E8449' }, { max:95,  label:'Neutral',  color:'#D35400' },
      { max:110, label:'Pressure',   color:'#C0392B' }, { max:999, label:'Spike',    color:'#7B241C' },
    ],
  },
  {
    id: 'foreignFlow', name: 'Foreign net (Rp T/mo)', default: -3.0, step: 0.5,
    thresholds: [
      { below:-5,  scores:[0,0,0,1,3] }, { below:-3,  scores:[0,0,1,2,0] },
      { below:-1,  scores:[0,0,2,1,0] }, { below:0,   scores:[0,1,2,0,0] },
      { below:2,   scores:[0,2,1,0,0] }, { below:5,   scores:[1,2,0,0,0] },
      { below:999, scores:[3,1,0,0,0] },
    ],
    zones: [
      { max:-3,  label:'Heavy sell', color:'#7B241C' }, { max:0,   label:'Net sell',   color:'#C0392B' },
      { max:3,   label:'Net buy',    color:'#2874A6' }, { max:999, label:'Strong buy', color:'#1E8449' },
    ],
  },
  {
    id: 'biRate', name: 'BI Rate', default: 5.75, step: 0.25,
    thresholds: [
      { below:4.0, scores:[3,1,0,0,0] }, { below:4.5, scores:[2,2,0,0,0] },
      { below:5.0, scores:[1,1,1,0,0] }, { below:5.5, scores:[0,1,1,1,0] },
      { below:6.0, scores:[0,0,1,1,1] }, { below:7.0, scores:[0,0,0,1,2] },
      { below:99,  scores:[0,0,0,0,3] },
    ],
    zones: [
      { max:4.25, label:'Easing',    color:'#1E8449' }, { max:5.0, label:'Neutral',   color:'#D35400' },
      { max:6.0,  label:'Tight',     color:'#C0392B' }, { max:99,  label:'Emergency', color:'#7B241C' },
    ],
  },
  {
    id: 'ihsg', name: 'IHSG', default: 7100, step: 50,
    thresholds: [
      { below:5500,  scores:[0,0,0,0,3] }, { below:6000,  scores:[0,0,0,1,2] },
      { below:6500,  scores:[0,0,0,2,1] }, { below:7000,  scores:[0,0,1,1,0] },
      { below:7500,  scores:[0,1,2,0,0] }, { below:8000,  scores:[1,2,1,0,0] },
      { below:8500,  scores:[1,2,0,0,0] }, { below:99999, scores:[2,2,0,0,0] },
    ],
    zones: [
      { max:6500,  label:'Bear',     color:'#C0392B' }, { max:7500,  label:'Stressed', color:'#D35400' },
      { max:8500,  label:'Neutral',  color:'#2874A6' }, { max:99999, label:'Bullish',  color:'#1E8449' },
    ],
  },
  {
    id: 'moodys', name: "Moody's status", default: 1, step: 1, isSelect: true,
    options: [
      { value:0, label:'Baa2 stable',   scores:[3,2,0,0,0] },
      { value:1, label:'Baa2 negative', scores:[0,1,2,1,0] },
      { value:2, label:'Baa3 stable',   scores:[0,0,1,2,1] },
      { value:3, label:'Baa3 negative', scores:[0,0,0,1,3] },
      { value:4, label:'Sub-IG',        scores:[0,0,0,0,4] },
    ],
    zones: [
      { max:0, label:'Stable',    color:'#1E8449' }, { max:1, label:'Negative', color:'#D35400' },
      { max:3, label:'Downgrade', color:'#C0392B' }, { max:4, label:'Sub-IG',   color:'#7B241C' },
    ],
  },
];

const PRICE_INDICATORS = [
  {
    id:'bbcaPrice', name:'BBCA', default:6825, step:25, ticker:'BBCA',
    thresholds:[{below:5000,scores:[0,0,0,1,3]},{below:5800,scores:[0,0,0,2,1]},{below:6200,scores:[0,0,1,2,0]},{below:7200,scores:[0,1,2,0,0]},{below:8000,scores:[0,2,1,0,0]},{below:9000,scores:[1,2,0,0,0]},{below:99999,scores:[3,1,0,0,0]}],
    zones:[{max:6200,label:'Aggr. Buy',color:'#C0392B'},{max:7200,label:'Accumulate',color:'#D35400'},{max:8500,label:'Fair',color:'#1E8449'},{max:99999,label:'Full',color:'#2874A6'}],
  },
  {
    id:'bbriPrice', name:'BBRI', default:3480, step:10, ticker:'BBRI',
    thresholds:[{below:2400,scores:[0,0,0,0,3]},{below:2800,scores:[0,0,0,1,2]},{below:3000,scores:[0,0,0,2,1]},{below:3600,scores:[0,1,2,0,0]},{below:4000,scores:[0,2,1,0,0]},{below:4500,scores:[1,2,0,0,0]},{below:99999,scores:[3,1,0,0,0]}],
    zones:[{max:3000,label:'Aggr. Buy',color:'#C0392B'},{max:3600,label:'Accumulate',color:'#D35400'},{max:4300,label:'Fair',color:'#1E8449'},{max:99999,label:'Full',color:'#2874A6'}],
  },
  {
    id:'bmriPrice', name:'BMRI', default:4840, step:10, ticker:'BMRI',
    thresholds:[{below:3200,scores:[0,0,0,0,3]},{below:3800,scores:[0,0,0,1,2]},{below:4200,scores:[0,0,1,2,0]},{below:5200,scores:[0,1,2,0,0]},{below:5800,scores:[0,2,1,0,0]},{below:6500,scores:[1,2,0,0,0]},{below:99999,scores:[3,1,0,0,0]}],
    zones:[{max:4200,label:'Aggr. Buy',color:'#C0392B'},{max:5200,label:'Accumulate',color:'#D35400'},{max:6200,label:'Fair',color:'#1E8449'},{max:99999,label:'Full',color:'#2874A6'}],
  },
  ...EXTRA_PRICE_INDICATORS,
];

const INDICATORS = [...MACRO_INDICATORS, ...PRICE_INDICATORS];

const SCENARIO_DETAILS = {
  BBCA: [
    { m12:'9,000–10,500', ret:'+32% to +54%', key:"Foreign net buy >Rp5T/mo, BI cut to 4.25%, Moody's stable, IDR <16,000" },
    { m12:'7,800–8,800',  ret:'+14% to +29%', key:'Loan growth 6–8%, IDR stable 16.5–17K, oil <$90, no rating action' },
    { m12:'6,500–7,500',  ret:'−5% to +10%',  key:'BI holds, fiscal deficit ~3%, IDR rangebound, no resolution' },
    { m12:'5,800–6,800',  ret:'−15% to 0%',   key:'Downgrade Baa3, IDR >18K, oil >$110, deficit breaches 3%' },
    { m12:'4,800–6,000',  ret:'−30% to −12%', key:'Sub-IG, IDR >20K, BI hikes to 7%+, capital controls' },
  ],
  BBRI: [
    { m12:'4,500–5,200', ret:'+29% to +49%', key:'Credit cost <3%, micro NPL improving, BI cuts, commodity tailwind' },
    { m12:'4,000–4,600', ret:'+15% to +32%', key:'Credit cost ~3.2%, loan growth 8–10%, NIM recovery, stable policy' },
    { m12:'3,300–3,800', ret:'−5% to +9%',   key:'Credit cost >3.5%, micro NPL flat, GDP slows to 4.5%, no catalyst' },
    { m12:'2,800–3,400', ret:'−20% to −2%',  key:'Credit cost >4%, Danantara interference, IDR >18K, foreign sell' },
    { m12:'2,200–2,800', ret:'−37% to −20%', key:'Systemic micro defaults, dividend cut, government recapitalization' },
  ],
  BMRI: [
    { m12:'6,200–7,200', ret:'+28% to +49%', key:'Loan growth >12%, NIM >5%, digital banking metrics surprise' },
    { m12:'5,500–6,300', ret:'+14% to +30%', key:'Loan growth 8–10%, asset quality stable, dividend maintained' },
    { m12:'4,600–5,400', ret:'−5% to +12%',  key:'No catalyst, foreign sell slows, corporate credit rangebound' },
    { m12:'3,800–4,600', ret:'−22% to −5%',  key:'Corporate NPL >3%, SOE stress, NIM compression >50bps, BUMN drag' },
    { m12:'3,000–3,800', ret:'−38% to −21%', key:'Systemic corporate default wave, BUMN recap, BI emergency hike' },
  ],
  ...EXTRA_SCENARIO_DETAILS,
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function getZone(ind, val) {
  for (const z of ind.zones) { if (val <= z.max) return z; }
  return ind.zones[ind.zones.length - 1];
}

function getScores(ind, val) {
  if (ind.isSelect) {
    const o = ind.options.find(opt => opt.value === val);
    return o ? o.scores : [0,0,1,0,0];
  }
  for (const t of ind.thresholds) { if (val < t.below) return t.scores; }
  return ind.thresholds[ind.thresholds.length - 1].scores;
}

function computeProbs(values, ticker) {
  const base = [...BASE_PROBS[ticker]];
  const ts = [0,0,0,0,0];
  INDICATORS.filter(i => !i.ticker || i.ticker === ticker).forEach(ind => {
    const v = values[ind.id];
    if (v === undefined) return;
    getScores(ind, v).forEach((s, i) => { ts[i] += s; });
  });
  const tot = ts.reduce((a,b) => a+b, 0) || 1;
  const adj = base.map((b, i) => b * (0.4 + ts[i] / tot * 3.0));
  const sum = adj.reduce((a,b) => a+b, 0);
  return adj.map(a => Math.round(a / sum * 100));
}

function getAction(ticker, values) {
  const pk = ticker.toLowerCase() + 'Price';
  const price = values[pk] || 0;
  const ind = INDICATORS.find(i => i.id === pk);
  if (!ind) return { zone: '?', color: '#888', action: '' };
  const z = getZone(ind, price);
  const actions = {
    'Aggr. Buy':  'Deploy 3–4× tranche. Generational entry.',
    'Accumulate': 'Normal tranches. Good risk-reward.',
    'Fair':       'Hold. Stop adding.',
    'Full':       'Trim 10–20%.',
  };
  return { zone: z.label, color: z.color, action: actions[z.label] || '' };
}

function computeHealthScore(values) {
  let score = 0, total = 0;
  MACRO_INDICATORS.forEach(ind => {
    const v = values[ind.id];
    if (v === undefined) return;
    const z = getZone(ind, v);
    const idx = ind.zones.indexOf(z);
    score += Math.round(100 * (ind.zones.length - 1 - idx) / (ind.zones.length - 1));
    total += 100;
  });
  return total > 0 ? Math.round(score / total * 100) : 50;
}

function healthLabel(score) {
  if (score >= 65) return { label:'Constructive', color:'#1E8449' };
  if (score >= 45) return { label:'Neutral',      color:'#D35400' };
  if (score >= 30) return { label:'Stressed',     color:'#C0392B' };
  return               { label:'Crisis Mode',   color:'#7B241C' };
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'indoinvest-v2';
function loadStorage()      { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; } }
function persistStorage(o)  { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(o)); } catch {} }

function defaultValues() {
  const d = {};
  INDICATORS.forEach(i => { d[i.id] = i.default; });
  return d;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [values, setValues]             = useState(() => {
    // Priority: URL hash → localStorage → defaults
    const fromHash = decodeState(window.location.hash);
    if (fromHash && typeof fromHash === 'object' && Object.keys(fromHash).length > 3)
      return { ...defaultValues(), ...fromHash };
    const saved = loadStorage();
    return saved?.current ? { ...defaultValues(), ...saved.current } : defaultValues();
  });
  const [history, setHistory]           = useState(() => loadStorage()?.history || []);
  const [lastUpdate, setLastUpdate]     = useState(() => loadStorage()?.lastUpdate || null);
  const [activeTicker, setActiveTicker] = useState(0);
  const [marketState, setMarketState]   = useState(null);
  const [fetchStatus, setFetchStatus]   = useState(null);
  const [saving, setSaving]             = useState(false);
  const [expanded, setExpanded]         = useState(-1);
  const [liveFields, setLiveFields]       = useState(new Set());
  const [zoneAlerts, setZoneAlerts]       = useState([]);
  const [posCalcTicker, setPosCalcTicker] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null); // null | ms
  const [countdown, setCountdown]         = useState(null);     // seconds remaining
  const [showSensitivity, setShowSensitivity] = useState(false);

  // Ref so fetchData can always read latest values without re-creating
  const valuesRef = useRef(values);
  useEffect(() => { valuesRef.current = values; }, [values]);

  // Auto-refresh countdown (resets when lastUpdate changes after each fetch)
  useEffect(() => {
    if (!refreshInterval) { setCountdown(null); return; }
    setCountdown(Math.round(refreshInterval / 1000));
    const id = setInterval(() => {
      setCountdown(c => (c != null && c > 1) ? c - 1 : Math.round(refreshInterval / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [refreshInterval, lastUpdate]);

  // Wire up auto-refresh
  useAutoRefresh(fetchData, refreshInterval);

  // Sync values to URL hash (for sharing)
  useEffect(() => {
    if (Object.keys(values).length === 0) return;
    const encoded = encodeState(values);
    window.history.replaceState(null, '', '#' + encoded);
  }, [values]);

  const doSave = useCallback((v, hist, note = '') => {
    setSaving(true);
    const now = new Date().toISOString();
    const entry = { date: now, values: { ...v } };
    if (note) entry.note = note;
    const nh = [...hist, entry].slice(-90);
    setHistory(nh);
    setLastUpdate(now);
    persistStorage({ current: v, history: nh, lastUpdate: now });
    setSaving(false);
  }, []);

  const fetchData = useCallback(async () => {
    setFetchStatus('fetching');
    setLiveFields(new Set());
    try {
      const resp = await fetch('/api/fetch-market', { method: 'POST' });
      const data = await resp.json();
      if (!resp.ok) { setFetchStatus('error: ' + (data.error || resp.statusText)); return; }

      const prev = valuesRef.current;
      const next = { ...prev };
      const updated = new Set();
      const newAlerts = [];

      (data.autoFields || []).forEach(f => {
        if (data[f] != null) {
          const nv = parseFloat(data[f]);
          if (!isNaN(nv)) {
            const ind = INDICATORS.find(i => i.id === f);
            // Detect zone crossing
            if (ind && prev[f] != null) {
              const oz = getZone(ind, prev[f]);
              const nz = getZone(ind, nv);
              if (oz.label !== nz.label) {
                newAlerts.push({ ticker: ind.ticker || ind.name, field: ind.name, from: oz.label, to: nz.label, color: nz.color });
              }
            }
            next[f] = nv;
            updated.add(f);
          }
        }
      });

      setValues(next);
      setLiveFields(updated);
      if (newAlerts.length > 0) setZoneAlerts(newAlerts);
      if (data.marketState) setMarketState(data.marketState);
      doSave(next, history);
      setFetchStatus(`ok: ${updated.size} fields updated · ${data.date || new Date().toLocaleDateString()}`);
    } catch (e) {
      setFetchStatus('error: ' + (e.message || 'fetch failed'));
    }
  }, [history, doSave]);

  const updateValue = (id, val) => {
    setValues(prev => ({ ...prev, [id]: val }));
    setLiveFields(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const ticker     = TICKERS[activeTicker];
  const priceKey   = ticker.toLowerCase() + 'Price';
  const probs      = computeProbs(values, ticker);
  const ai         = getAction(ticker, values);
  const health     = computeHealthScore(values);
  const hl         = healthLabel(health);
  const macroInds  = MACRO_INDICATORS;
  const tickerInds = PRICE_INDICATORS.filter(i => i.ticker === ticker);
  const details    = SCENARIO_DETAILS[ticker] || [];

  // Sparkline data: last 30 price snapshots for active ticker
  const sparkData  = history.slice(-30).map(h => h.values[priceKey]).filter(v => v != null && v > 0);
  // Delta vs previous snapshot
  const prevPrice  = history.length > 0 ? history[history.length - 1]?.values[priceKey] : null;
  // Stale data warning
  const dataAgeHours = lastUpdate ? (Date.now() - new Date(lastUpdate).getTime()) / 3_600_000 : null;
  const isStale      = dataAgeHours != null && dataAgeHours > 24;
  // Probability trend chart data
  const chartData = history.slice(-20).map(entry => ({
    date:  entry.date,
    probs: computeProbs(entry.values, ticker),
  }));

  return (
    <div style={{ padding:'4px 0' }}>

      {/* ── Zone alerts ─────────────────────────────────────────────────── */}
      <ZoneAlert alerts={zoneAlerts} onDismiss={() => setZoneAlerts([])} />

      {/* ── Market health gauge ─────────────────────────────────────────── */}
      <div style={{
        display:'flex', alignItems:'center', gap:12, marginBottom:14,
        padding:'10px 14px', borderRadius:10,
        background:'var(--color-background-secondary)',
        border:'1px solid var(--color-border-tertiary)',
      }}>
        <div style={{
          width:52, height:52, borderRadius:'50%', flexShrink:0,
          background:`conic-gradient(${hl.color} ${health*3.6}deg, #222 0deg)`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--color-background-secondary)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:13, fontWeight:700, color:hl.color }}>{health}</span>
          </div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, fontWeight:600, color:hl.color }}>{hl.label}</div>
          <div style={{ fontSize:10, color:'var(--color-text-secondary)', marginTop:2 }}>Macro health score · 100 = fully constructive</div>
        </div>
        <div style={{ textAlign:'right' }}>
          {marketState && (
            <div style={{
              fontSize:9, fontWeight:700, letterSpacing:0.5,
              color: marketState==='REGULAR' ? '#1E8449' : '#8a8a8a',
              background: marketState==='REGULAR' ? 'rgba(30,132,73,0.1)' : 'rgba(100,100,100,0.1)',
              border:`1px solid ${marketState==='REGULAR'?'rgba(30,132,73,0.2)':'rgba(100,100,100,0.2)'}`,
              borderRadius:3, padding:'2px 6px', display:'inline-block',
            }}>IDX {marketState}</div>
          )}
          <div style={{ fontSize:10, color:'var(--color-text-tertiary)', marginTop:4 }}>
            {lastUpdate ? new Date(lastUpdate).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : 'no snapshot'}
          </div>
        </div>
      </div>

      {/* ── Action bar ──────────────────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
        <div style={{ fontSize:10, color:'var(--color-text-tertiary)' }}>8 fields auto · 4 manual</div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          {/* Live fetch */}
          <button onClick={fetchData} disabled={fetchStatus==='fetching'} style={{
            fontSize:12, padding:'6px 14px', fontWeight:600, border:'none', borderRadius:6,
            background: fetchStatus==='fetching' ? 'var(--color-background-secondary)' : '#1e3554',
            color: fetchStatus==='fetching' ? 'var(--color-text-secondary)' : '#93c5fd',
            cursor: fetchStatus==='fetching' ? 'default' : 'pointer',
          }}>
            {fetchStatus==='fetching' ? '⏳ Fetching…' : '⚡ Live fetch'}
          </button>

          {/* Auto-refresh */}
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <select value={refreshInterval ?? ''} onChange={e => setRefreshInterval(e.target.value ? parseInt(e.target.value) : null)}
              style={{ fontSize:11, padding:'5px 6px', background:'var(--color-background-elevated)', color:'var(--color-text-secondary)', border:'1px solid var(--color-border-tertiary)', borderRadius:6 }}>
              <option value="">🔄 Off</option>
              <option value="300000">5m</option>
              <option value="900000">15m</option>
              <option value="1800000">30m</option>
            </select>
            {countdown != null && (
              <span style={{ fontSize:10, color:'var(--color-text-tertiary)', fontVariantNumeric:'tabular-nums', minWidth:34 }}>
                {`${Math.floor(countdown/60)}:${String(countdown%60).padStart(2,'0')}`}
              </span>
            )}
          </div>

          {/* Save with note */}
          <SaveWithNote saving={saving} onSave={(note) => doSave(values, history, note)} />

          {/* Share link */}
          <button title="Copy shareable link"
            onClick={() => { navigator.clipboard?.writeText(window.location.href); setFetchStatus('ok: link copied to clipboard'); }}
            style={{ fontSize:12, padding:'6px 10px', background:'var(--color-background-elevated)', color:'var(--color-text-secondary)', border:'1px solid var(--color-border-tertiary)', borderRadius:6 }}>
            🔗
          </button>
        </div>
      </div>

      {/* Status pill */}
      {fetchStatus && fetchStatus !== 'fetching' && (
        <div style={{
          fontSize:11, padding:'5px 10px', marginBottom:10, borderRadius:5,
          background: fetchStatus.startsWith('error') ? 'rgba(192,57,43,0.1)' : 'rgba(30,132,73,0.1)',
          color: fetchStatus.startsWith('error') ? '#e74c3c' : '#2ecc71',
          border:`1px solid ${fetchStatus.startsWith('error')?'rgba(192,57,43,0.2)':'rgba(30,132,73,0.2)'}`,
        }}>
          {fetchStatus.startsWith('error') ? '⚠ ' : '✓ '}{fetchStatus.replace(/^(ok|error): ?/,'')}
        </div>
      )}

      {/* Stale data warning */}
      {isStale && (
        <div style={{
          fontSize:11, padding:'5px 10px', marginBottom:10, borderRadius:5,
          background:'rgba(211,84,0,0.08)', color:'#D35400',
          border:'1px solid rgba(211,84,0,0.2)',
          display:'flex', justifyContent:'space-between', alignItems:'center',
        }}>
          <span>⚠ Data is {Math.round(dataAgeHours ?? 0)}h old — prices may be stale</span>
          <button onClick={fetchData} style={{ fontSize:11, color:'#D35400', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>
            Refresh now
          </button>
        </div>
      )}

      {/* ── Ticker tabs ─────────────────────────────────────────────────── */}
      <div className="ticker-tabs" style={{ display:'flex', gap:4, marginBottom:12, flexWrap:'wrap' }}>
        {TICKERS.map((t, i) => (
          <button key={t} onClick={() => { setActiveTicker(i); setExpanded(-1); setPosCalcTicker(null); }}
            style={{
              padding:'7px 16px', borderRadius:8, fontSize:13,
              fontWeight: activeTicker===i ? 700 : 400,
              border:`${activeTicker===i?'1.5':'1'}px solid ${activeTicker===i?'var(--color-border-primary)':'var(--color-border-tertiary)'}`,
              background: activeTicker===i ? 'var(--color-background-elevated)' : 'transparent',
              color: activeTicker===i ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Position card ───────────────────────────────────────────────── */}
      <div style={{
        background:`${ai.color}12`, border:`1.5px solid ${ai.color}30`,
        borderRadius:10, padding:'12px 16px', marginBottom:4,
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:10, fontWeight:700, color:ai.color, textTransform:'uppercase', letterSpacing:0.6 }}>{ai.zone}</span>
              <span style={{ fontSize:20, fontWeight:700, color:'var(--color-text-primary)' }}>
                Rp {(values[priceKey]||0).toLocaleString()}
              </span>
              {liveFields.has(priceKey) && (
                <span style={{ fontSize:8, fontWeight:700, color:'#1E8449', background:'rgba(30,132,73,0.12)', border:'1px solid rgba(30,132,73,0.25)', borderRadius:3, padding:'0 4px' }}>LIVE</span>
              )}
              <DeltaChip current={values[priceKey]||0} previous={prevPrice} format="both" />
            </div>
            <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginTop:4 }}>{ai.action}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {sparkData.length > 1 && (
              <Sparkline data={sparkData} color={ai.color} width={90} height={32} />
            )}
            <button
              onClick={() => setPosCalcTicker(posCalcTicker === ticker ? null : ticker)}
              title="Position sizing calculator"
              style={{
                fontSize:11, padding:'5px 9px', borderRadius:6, cursor:'pointer',
                background: posCalcTicker===ticker ? `${ai.color}20` : 'var(--color-background-elevated)',
                color: posCalcTicker===ticker ? ai.color : 'var(--color-text-secondary)',
                border:`1px solid ${posCalcTicker===ticker ? ai.color+'44' : 'var(--color-border-tertiary)'}`,
              }}>
              📊 Size
            </button>
          </div>
        </div>
      </div>

      {/* ── Position calc (inline) ──────────────────────────────────────── */}
      {posCalcTicker && (
        <div style={{ marginBottom:10 }}>
          <PositionCalc ticker={ticker} currentPrice={values[priceKey]||0} zone={ai.zone} onClose={() => setPosCalcTicker(null)} />
        </div>
      )}

      {/* ── Scenario probability grid ───────────────────────────────────── */}
      <div className="scenario-grid" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:4, marginBottom:14, marginTop:10 }}>
        {SCENARIOS.map((s, i) => {
          const diff = probs[i] - BASE_PROBS[ticker][i];
          return (
            <div key={s} style={{ background:`${S_COLORS[i]}10`, borderRadius:8, padding:'8px 4px', textAlign:'center', border:`1px solid ${S_COLORS[i]}22` }}>
              <div style={{ fontSize:22, fontWeight:700, color:S_COLORS[i] }}>{probs[i]}%</div>
              <div style={{ fontSize:9, color:S_COLORS[i], lineHeight:1.3, marginTop:2 }}>{s}</div>
              {diff !== 0 && (
                <div style={{ fontSize:9, fontWeight:700, marginTop:2, color: diff>0?(i<2?'#1E8449':'#C0392B'):(i<2?'#C0392B':'#1E8449') }}>
                  {diff>0?'+':''}{diff}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Macro Indicators ────────────────────────────────────────────── */}
      <div style={{ marginBottom:14 }}>
        <SectionLabel>Macro Indicators</SectionLabel>
        {macroInds.map(ind => (
          <IndicatorRow key={ind.id} ind={ind}
            value={values[ind.id] ?? ind.default}
            isLive={liveFields.has(ind.id)}
            onChange={val => updateValue(ind.id, val)} />
        ))}
        <SectionLabel style={{ marginTop:10 }}>{ticker} Price</SectionLabel>
        {tickerInds.map(ind => (
          <IndicatorRow key={ind.id} ind={ind}
            value={values[ind.id] ?? ind.default}
            isLive={liveFields.has(ind.id)}
            onChange={val => updateValue(ind.id, val)} />
        ))}
      </div>

      {/* ── Sensitivity analysis ────────────────────────────────────────── */}
      <div style={{ marginBottom:14 }}>
        <div onClick={() => setShowSensitivity(s => !s)}
          style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', marginBottom:showSensitivity?6:0 }}>
          <SectionLabel style={{ marginBottom:0 }}>Sensitivity Analysis — {ticker}</SectionLabel>
          <span style={{ fontSize:10, color:'var(--color-text-tertiary)', display:'inline-block', transform:showSensitivity?'rotate(90deg)':'none', transition:'transform .15s' }}>▶</span>
        </div>
        {showSensitivity && (
          <SensitivityTable
            indicators={INDICATORS}
            values={values}
            ticker={ticker}
            baseProbs={BASE_PROBS}
            scenarios={SCENARIOS}
            sColors={S_COLORS}
            computeProbs={computeProbs}
          />
        )}
      </div>

      {/* ── 12-month scenario accordion ─────────────────────────────────── */}
      <SectionLabel>{ticker} — 12-month scenarios</SectionLabel>
      {SCENARIOS.map((s, i) => {
        const d = details[i];
        if (!d) return null;
        const isOpen = expanded === i;
        return (
          <div key={s} onClick={() => setExpanded(isOpen ? -1 : i)}
            style={{
              border:`${isOpen?'1.5':'1'}px solid ${isOpen?S_COLORS[i]+'55':'var(--color-border-tertiary)'}`,
              borderRadius:8, padding:'9px 13px', marginBottom:4, cursor:'pointer',
              background: isOpen ? `${S_COLORS[i]}0A` : 'var(--color-background-secondary)',
              transition:'background .1s, border-color .1s',
            }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:13, fontWeight:600, color:S_COLORS[i] }}>{s}</span>
                <span style={{ fontSize:11, padding:'1px 6px', borderRadius:3, background:`${S_COLORS[i]}18`, color:S_COLORS[i], fontWeight:600 }}>{probs[i]}%</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:12, fontWeight:500, color:'var(--color-text-primary)' }}>Rp {d.m12}</span>
                <span style={{ fontSize:11, fontWeight:600, color: d.ret.startsWith('+')?'#1E8449':'#C0392B' }}>{d.ret}</span>
                <span style={{ fontSize:10, color:'var(--color-text-secondary)', display:'inline-block', transform:isOpen?'rotate(90deg)':'none', transition:'transform .1s' }}>▶</span>
              </div>
            </div>
            {isOpen && (
              <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid var(--color-border-tertiary)' }}>
                <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:4 }}>Key triggers</div>
                <div style={{ fontSize:12, lineHeight:1.6, color:'var(--color-text-primary)' }}>{d.key}</div>
              </div>
            )}
          </div>
        );
      })}

      {/* ── Snapshot history ────────────────────────────────────────────── */}
      {history.length > 1 && (
        <div style={{ marginTop:16 }}>
          <SectionLabel>Snapshot history — last {Math.min(history.length, 7)}</SectionLabel>
          <div style={{ overflowX:'auto' }}>
            <div style={{ display:'grid', gridTemplateColumns:'58px repeat(5,1fr) repeat(5,54px)', gap:2, fontSize:10, minWidth:520 }}>
              <Cell header>Date</Cell>
              {SCENARIOS.map((s,i) => <Cell key={s} header style={{ color:S_COLORS[i], fontSize:9 }}>{s.split(' ')[0]}</Cell>)}
              {TICKERS.map(t => <Cell key={t} header style={{ fontSize:9 }}>{t}</Cell>)}
              {history.slice(-7).map((entry, ei) => {
                const p = computeProbs(entry.values, ticker);
                const dt = new Date(entry.date);
                return (
                  <React.Fragment key={ei}>
                    <Cell title={entry.note || undefined} style={{ cursor: entry.note ? 'help' : undefined, textDecoration: entry.note ? 'underline dotted #555' : undefined }}>
                      {dt.toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}{entry.note ? ' 📝' : ''}
                    </Cell>
                    {p.map((prob, pi) => (
                      <Cell key={pi} style={{ background:`${S_COLORS[pi]}${Math.round(prob*0.5).toString(16).padStart(2,'0')}`, color:S_COLORS[pi], fontWeight:600, textAlign:'center' }}>{prob}%</Cell>
                    ))}
                    {TICKERS.map(t => (
                      <Cell key={t} center>{(entry.values[t.toLowerCase()+'Price']||0).toLocaleString()}</Cell>
                    ))}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Probability trend chart ─────────────────────────────────────── */}
      {chartData.length >= 2 && (
        <div style={{ marginTop:16 }}>
          <SectionLabel>Probability trend — {ticker}</SectionLabel>
          <div style={{ background:'#1c1c1c', borderRadius:10, padding:'14px 14px 8px', border:'1px solid #2a2a2a' }}>
            <ProbTrendChart data={chartData} scenarios={SCENARIOS} colors={S_COLORS} height={160} />
          </div>
        </div>
      )}

      {/* ── Catalyst calendar ───────────────────────────────────────────── */}
      <div style={{ marginTop:16 }}>
        <SectionLabel>Catalyst Calendar</SectionLabel>
        <CatalystCalendar catalysts={CATALYSTS} types={CATALYST_TYPES} ticker={ticker} />
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div style={{ fontSize:10, color:'var(--color-text-tertiary)', padding:'14px 0 4px', marginTop:12, lineHeight:1.7 }}>
        Live prices via Yahoo Finance (BBCA/BBRI/BMRI/BBNI/BRIS · ^JKSE · IDR=X · BZ=F) — no API key required.
        BI Rate, SBN yield, foreign flow, and Moody's updated manually. 🔗 copies a shareable link with current values.
        Auto-refresh keeps prices current during market hours. Not financial advice.
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children, style }) {
  return (
    <div style={{ fontSize:10, fontWeight:600, color:'var(--color-text-tertiary)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6, ...style }}>
      {children}
    </div>
  );
}

function IndicatorRow({ ind, value, isLive, onChange }) {
  const isManual = MANUAL_FIELDS.has(ind.id);
  const z = ind.isSelect
    ? (ind.zones.find(zone => value <= zone.max) || ind.zones[ind.zones.length-1])
    : getZone(ind, value);
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="indicator-row" style={{
      display:'grid', gridTemplateColumns:'1fr 60px',
      marginBottom:3, borderRadius:6,
      background:'var(--color-background-secondary)',
      borderLeft:`3px solid ${z.color}`,
      overflow:'hidden',
      outline: isLive ? `1px solid ${z.color}44` : 'none',
      transition:'outline .3s',
    }}>
      <div style={{ display:'grid', gridTemplateColumns:'118px 1fr', gap:8, alignItems:'center', padding:'5px 10px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ fontSize:11, fontWeight:500, color:'var(--color-text-primary)' }}>{ind.name}</span>
          {isLive && (
            <span style={{ fontSize:8, fontWeight:700, color:'#1E8449', background:'rgba(30,132,73,0.12)', border:'1px solid rgba(30,132,73,0.2)', borderRadius:2, padding:'0 3px' }}>LIVE</span>
          )}
          {isManual && !isLive && (
            <button onClick={() => setShowHint(h => !h)} title={MANUAL_HINTS[ind.id]}
              style={{ fontSize:9, color:'#D35400', background:'rgba(211,84,0,0.1)', border:'1px solid rgba(211,84,0,0.2)', borderRadius:2, padding:'0 3px', cursor:'pointer' }}>✎</button>
          )}
        </div>
        {ind.isSelect ? (
          <select value={value} onChange={e => onChange(parseInt(e.target.value))} style={{ fontSize:11, flex:1 }}>
            {ind.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <input type="range"
              min={ind.id==='foreignFlow' ? -8 : ind.thresholds[0].below*0.7}
              max={ind.id==='foreignFlow' ? 10 : ind.thresholds[ind.thresholds.length-1].below*(ind.thresholds[ind.thresholds.length-1].below>100?1:1.05)}
              step={ind.step} value={value}
              onChange={e => onChange(parseFloat(e.target.value))}
              style={{ flex:1 }} />
            <input type="number" value={value} step={ind.step}
              onChange={e => onChange(parseFloat(e.target.value)||0)}
              style={{ width:ind.ticker?72:64, fontSize:11, textAlign:'right' }} />
          </div>
        )}
      </div>
      <div style={{ fontSize:10, fontWeight:600, color:z.color, background:`${z.color}10`, display:'flex', alignItems:'center', justifyContent:'center', borderLeft:`1px solid ${z.color}20`, textAlign:'center', padding:'0 4px', lineHeight:1.2 }}>
        {z.label}
      </div>
      {showHint && (
        <div style={{ gridColumn:'1 / -1', fontSize:10, color:'#D35400', background:'rgba(211,84,0,0.06)', borderTop:'1px solid rgba(211,84,0,0.15)', padding:'4px 10px', lineHeight:1.5 }}>
          ✎ {MANUAL_HINTS[ind.id]}
        </div>
      )}
    </div>
  );
}

function Cell({ children, header, center, style }) {
  return (
    <div style={{ padding:3, borderRadius:2, color:header?'var(--color-text-secondary)':'var(--color-text-primary)', fontWeight:header?600:400, textAlign:center?'center':undefined, fontSize:10, ...style }}>
      {children}
    </div>
  );
}
