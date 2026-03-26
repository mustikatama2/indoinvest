import React, { useState, useEffect, useCallback } from 'react';

const TICKERS = ['BBCA', 'BBRI', 'BMRI'];
const SCENARIOS = ['V-shape recovery', 'Gradual grind', 'Sideways chop', 'Extended bear', 'Full crisis'];
const S_COLORS = ['#1E8449', '#2874A6', '#D35400', '#C0392B', '#7B241C'];
const BASE_PROBS = {
  BBCA: [15, 40, 25, 15, 5],
  BBRI: [12, 35, 28, 18, 7],
  BMRI: [15, 38, 27, 15, 5],
};

const INDICATORS = [
  {
    id: 'fx', name: 'IDR/USD', default: 16850, step: 50,
    thresholds: [
      { below: 15500, scores: [3,1,0,0,0] },
      { below: 16000, scores: [2,2,0,0,0] },
      { below: 16500, scores: [1,2,0,0,0] },
      { below: 17000, scores: [0,1,1,0,0] },
      { below: 17500, scores: [0,0,1,1,0] },
      { below: 18000, scores: [0,0,0,2,1] },
      { below: 19000, scores: [0,0,0,1,2] },
      { below: 99999, scores: [0,0,0,0,3] },
    ],
    zones: [
      { max:16000, label:'Bullish', color:'#1E8449' },
      { max:17000, label:'Neutral', color:'#D35400' },
      { max:18000, label:'Stress',  color:'#C0392B' },
      { max:99999, label:'Crisis',  color:'#7B241C' },
    ],
  },
  {
    id: 'sbn10y', name: '10Y SBN yield', default: 6.40, step: 0.05,
    thresholds: [
      { below: 5.5, scores: [3,1,0,0,0] },
      { below: 6.0, scores: [2,2,0,0,0] },
      { below: 6.5, scores: [1,1,1,0,0] },
      { below: 7.0, scores: [0,1,1,1,0] },
      { below: 7.5, scores: [0,0,0,2,1] },
      { below: 8.0, scores: [0,0,0,1,2] },
      { below: 99,  scores: [0,0,0,0,3] },
    ],
    zones: [
      { max:6.0, label:'Bullish', color:'#1E8449' },
      { max:6.8, label:'Neutral', color:'#D35400' },
      { max:7.5, label:'Stress',  color:'#C0392B' },
      { max:99,  label:'Crisis',  color:'#7B241C' },
    ],
  },
  {
    id: 'oil', name: 'Oil (Brent)', default: 97, step: 1,
    thresholds: [
      { below: 70,  scores: [3,1,0,0,0] },
      { below: 80,  scores: [2,2,0,0,0] },
      { below: 90,  scores: [1,2,1,0,0] },
      { below: 100, scores: [0,1,1,1,0] },
      { below: 110, scores: [0,0,0,2,1] },
      { below: 130, scores: [0,0,0,1,2] },
      { below: 999, scores: [0,0,0,0,3] },
    ],
    zones: [
      { max:80,  label:'Supportive', color:'#1E8449' },
      { max:95,  label:'Neutral',    color:'#D35400' },
      { max:110, label:'Pressure',   color:'#C0392B' },
      { max:999, label:'Spike',      color:'#7B241C' },
    ],
  },
  {
    id: 'foreignFlow', name: 'Foreign net (Rp T/mo)', default: -3.0, step: 0.5,
    thresholds: [
      { below: -5,  scores: [0,0,0,1,3] },
      { below: -3,  scores: [0,0,1,2,0] },
      { below: -1,  scores: [0,0,2,1,0] },
      { below: 0,   scores: [0,1,2,0,0] },
      { below: 2,   scores: [0,2,1,0,0] },
      { below: 5,   scores: [1,2,0,0,0] },
      { below: 999, scores: [3,1,0,0,0] },
    ],
    zones: [
      { max:-3,  label:'Heavy sell', color:'#7B241C' },
      { max:0,   label:'Net sell',   color:'#C0392B' },
      { max:3,   label:'Net buy',    color:'#2874A6' },
      { max:999, label:'Strong buy', color:'#1E8449' },
    ],
  },
  {
    id: 'biRate', name: 'BI Rate', default: 4.75, step: 0.25,
    thresholds: [
      { below: 4.0, scores: [3,1,0,0,0] },
      { below: 4.5, scores: [2,2,0,0,0] },
      { below: 5.0, scores: [1,1,1,0,0] },
      { below: 5.5, scores: [0,1,1,1,0] },
      { below: 6.0, scores: [0,0,1,1,1] },
      { below: 7.0, scores: [0,0,0,1,2] },
      { below: 99,  scores: [0,0,0,0,3] },
    ],
    zones: [
      { max:4.25, label:'Easing',    color:'#1E8449' },
      { max:5.0,  label:'Neutral',   color:'#D35400' },
      { max:6.0,  label:'Tight',     color:'#C0392B' },
      { max:99,   label:'Emergency', color:'#7B241C' },
    ],
  },
  {
    id: 'ihsg', name: 'IHSG', default: 7100, step: 50,
    thresholds: [
      { below: 5500,  scores: [0,0,0,0,3] },
      { below: 6000,  scores: [0,0,0,1,2] },
      { below: 6500,  scores: [0,0,0,2,1] },
      { below: 7000,  scores: [0,0,1,1,0] },
      { below: 7500,  scores: [0,1,2,0,0] },
      { below: 8000,  scores: [1,2,1,0,0] },
      { below: 8500,  scores: [1,2,0,0,0] },
      { below: 99999, scores: [2,2,0,0,0] },
    ],
    zones: [
      { max:6500,  label:'Bear',     color:'#C0392B' },
      { max:7500,  label:'Stressed', color:'#D35400' },
      { max:8500,  label:'Neutral',  color:'#2874A6' },
      { max:99999, label:'Bullish',  color:'#1E8449' },
    ],
  },
  {
    id: 'moodys', name: "Moody's status", default: 1, step: 1, isSelect: true,
    options: [
      { value: 0, label: 'Baa2 stable',    scores: [3,2,0,0,0] },
      { value: 1, label: 'Baa2 negative',  scores: [0,1,2,1,0] },
      { value: 2, label: 'Baa3 stable',    scores: [0,0,1,2,1] },
      { value: 3, label: 'Baa3 negative',  scores: [0,0,0,1,3] },
      { value: 4, label: 'Sub-IG',         scores: [0,0,0,0,4] },
    ],
    zones: [
      { max:0, label:'Stable',   color:'#1E8449' },
      { max:1, label:'Negative', color:'#D35400' },
      { max:3, label:'Downgrade',color:'#C0392B' },
      { max:4, label:'Sub-IG',   color:'#7B241C' },
    ],
  },
  {
    id: 'bbcaPrice', name: 'BBCA', default: 6825, step: 25, ticker: 'BBCA',
    thresholds: [
      { below:5000,  scores:[0,0,0,1,3] },
      { below:5800,  scores:[0,0,0,2,1] },
      { below:6200,  scores:[0,0,1,2,0] },
      { below:7200,  scores:[0,1,2,0,0] },
      { below:8000,  scores:[0,2,1,0,0] },
      { below:9000,  scores:[1,2,0,0,0] },
      { below:99999, scores:[3,1,0,0,0] },
    ],
    zones: [
      { max:6200,  label:'Aggr. AQ',  color:'#C0392B' },
      { max:7200,  label:'Accumulate',color:'#D35400' },
      { max:8500,  label:'Fair',      color:'#1E8449' },
      { max:99999, label:'Full',      color:'#2874A6' },
    ],
  },
  {
    id: 'bbriPrice', name: 'BBRI', default: 3480, step: 10, ticker: 'BBRI',
    thresholds: [
      { below:2400,  scores:[0,0,0,0,3] },
      { below:2800,  scores:[0,0,0,1,2] },
      { below:3000,  scores:[0,0,0,2,1] },
      { below:3600,  scores:[0,1,2,0,0] },
      { below:4000,  scores:[0,2,1,0,0] },
      { below:4500,  scores:[1,2,0,0,0] },
      { below:99999, scores:[3,1,0,0,0] },
    ],
    zones: [
      { max:3000,  label:'Aggr. AQ',  color:'#C0392B' },
      { max:3600,  label:'Accumulate',color:'#D35400' },
      { max:4300,  label:'Fair',      color:'#1E8449' },
      { max:99999, label:'Full',      color:'#2874A6' },
    ],
  },
  {
    id: 'bmriPrice', name: 'BMRI', default: 4840, step: 10, ticker: 'BMRI',
    thresholds: [
      { below:3200,  scores:[0,0,0,0,3] },
      { below:3800,  scores:[0,0,0,1,2] },
      { below:4200,  scores:[0,0,1,2,0] },
      { below:5200,  scores:[0,1,2,0,0] },
      { below:5800,  scores:[0,2,1,0,0] },
      { below:6500,  scores:[1,2,0,0,0] },
      { below:99999, scores:[3,1,0,0,0] },
    ],
    zones: [
      { max:4200,  label:'Aggr. AQ',  color:'#C0392B' },
      { max:5200,  label:'Accumulate',color:'#D35400' },
      { max:6200,  label:'Fair',      color:'#1E8449' },
      { max:99999, label:'Full',      color:'#2874A6' },
    ],
  },
];

function getZone(ind, val) {
  for (const z of ind.zones) {
    if (val <= z.max) return z;
  }
  return ind.zones[ind.zones.length - 1];
}

function getScores(ind, val) {
  if (ind.isSelect) {
    const o = ind.options.find(opt => opt.value === val);
    return o ? o.scores : [0,0,1,0,0];
  }
  for (const t of ind.thresholds) {
    if (val < t.below) return t.scores;
  }
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
    'Aggr. AQ':   'Deploy 3–4× tranche. Generational entry.',
    'Accumulate': 'Normal tranches. Good risk-reward.',
    'Fair':       'Hold. Stop adding.',
    'Full':       'Trim 10–20%.',
  };
  return { zone: z.label, color: z.color, action: actions[z.label] || '' };
}

const STORAGE_KEY = 'indoinvest-v1';

const SCENARIO_DETAILS = {
  BBCA: [
    { m12: '9,000–10,500', ret: '+32% to +54%', key: 'Foreign net buy >Rp5T/mo, BI cut to 4.25%, Moody\'s stable' },
    { m12: '7,800–8,800',  ret: '+14% to +29%', key: 'Loan growth 6–8%, IDR stable 16.5–17K, oil <$90' },
    { m12: '6,500–7,500',  ret: '−5% to +10%',  key: 'BI holds 4.75%, deficit ~3%, no rating resolution' },
    { m12: '5,800–6,800',  ret: '−15% to 0%',   key: 'Downgrade Baa3, IDR >18K, oil >$110, deficit >3%' },
    { m12: '4,800–6,000',  ret: '−30% to −12%', key: 'Sub-IG, IDR >20K, BI hikes 7%+, capital controls' },
  ],
  BBRI: [
    { m12: '4,500–5,200', ret: '+29% to +49%', key: 'Credit cost <3%, micro NPL improving, BI cuts' },
    { m12: '4,000–4,600', ret: '+15% to +32%', key: 'Credit cost ~3.2%, loan growth 8–10%, NIM recovery' },
    { m12: '3,300–3,800', ret: '−5% to +9%',   key: 'Credit cost >3.5%, micro NPL flat, GDP slows to 4.5%' },
    { m12: '2,800–3,400', ret: '−20% to −2%',  key: 'Credit cost >4%, Danantara interference, IDR >18K' },
    { m12: '2,200–2,800', ret: '−37% to −20%', key: 'Systemic micro defaults, dividend cut, recapitalization' },
  ],
  BMRI: [
    { m12: '6,200–7,200', ret: '+28% to +49%', key: 'Loan growth >12%, NIM >5%, digital metrics surprise' },
    { m12: '5,500–6,300', ret: '+14% to +30%', key: 'Loan growth 8–10%, stable quality, dividend maintained' },
    { m12: '4,600–5,400', ret: '−5% to +12%',  key: 'No catalyst, foreign sell slows, range-bound' },
    { m12: '3,800–4,600', ret: '−22% to −5%',  key: 'Corporate NPL >3%, SOE stress, NIM compression >50bps' },
    { m12: '3,000–3,800', ret: '−38% to −21%', key: 'Systemic corporate default, BUMN recapitalization' },
  ],
};

function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveStorage(obj) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch {}
}

export default function Dashboard() {
  const [values, setValues] = useState({});
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeTicker, setActiveTicker] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [fetchStatus, setFetchStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedScenario, setExpandedScenario] = useState(-1);

  useEffect(() => {
    const data = loadStorage();
    if (data?.current) {
      setValues(data.current);
      setHistory(data.history || []);
      setLastUpdate(data.lastUpdate || null);
    } else {
      const d = {};
      INDICATORS.forEach(i => { d[i.id] = i.default; });
      setValues(d);
    }
    setLoaded(true);
  }, []);

  const saveSnapshot = useCallback((v, hist) => {
    setSaving(true);
    const now = new Date().toISOString();
    const nh = [...hist, { date: now, values: { ...v } }].slice(-90);
    setHistory(nh);
    setLastUpdate(now);
    saveStorage({ current: v, history: nh, lastUpdate: now });
    setSaving(false);
    return nh;
  }, []);

  const fetchData = useCallback(async () => {
    setFetchStatus('fetching');
    try {
      const resp = await fetch('/api/fetch-market', { method: 'POST' });
      const data = await resp.json();
      if (!resp.ok) {
        setFetchStatus('error: ' + (data.error || resp.statusText));
        return;
      }
      const newValues = { ...values };
      const fields = ['fx','sbn10y','oil','ihsg','bbcaPrice','bbriPrice','bmriPrice','foreignFlow','biRate'];
      fields.forEach(f => {
        if (data[f] !== undefined && data[f] !== null) newValues[f] = parseFloat(data[f]);
      });
      setValues(newValues);
      saveSnapshot(newValues, history);
      setFetchStatus('updated: ' + (data.date || new Date().toLocaleDateString()));
    } catch (e) {
      setFetchStatus('error: ' + (e.message || 'fetch failed'));
    }
  }, [values, history, saveSnapshot]);

  const updateValue = (id, val) => setValues(prev => ({ ...prev, [id]: val }));

  if (!loaded) {
    return <div style={{ padding: 20, color: 'var(--color-text-secondary)' }}>Loading…</div>;
  }

  const ticker = TICKERS[activeTicker];
  const probs = computeProbs(values, ticker);
  const ai = getAction(ticker, values);
  const macroInds = INDICATORS.filter(i => !i.ticker);
  const tickerInds = INDICATORS.filter(i => i.ticker === ticker);
  const details = SCENARIO_DETAILS[ticker];

  return (
    <div style={{ padding: '4px 0' }}>
      {/* Top bar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8, marginBottom:12 }}>
        <div style={{ fontSize:11, color:'var(--color-text-secondary)' }}>
          {lastUpdate
            ? `Last: ${new Date(lastUpdate).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}`
            : 'No snapshot yet'}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button
            onClick={fetchData}
            disabled={fetchStatus === 'fetching'}
            style={{
              fontSize:13, padding:'6px 14px', fontWeight:500,
              background: fetchStatus === 'fetching' ? 'var(--color-background-secondary)' : 'var(--color-background-info)',
              color: fetchStatus === 'fetching' ? 'var(--color-text-secondary)' : 'var(--color-text-info)',
              border:'none', borderRadius:6,
            }}>
            {fetchStatus === 'fetching' ? 'Fetching live data…' : '⚡ Fetch today\'s data'}
          </button>
          <button
            onClick={() => saveSnapshot(values, history)}
            style={{
              fontSize:13, padding:'6px 14px', fontWeight:500,
              background:'var(--color-background-elevated)',
              color:'var(--color-text-primary)',
              border:'1px solid var(--color-border-tertiary)',
              borderRadius:6,
            }}>
            {saving ? 'Saving…' : '💾 Save'}
          </button>
        </div>
      </div>

      {/* Status pill */}
      {fetchStatus && fetchStatus !== 'fetching' && (
        <div style={{
          fontSize:11, padding:'4px 10px', marginBottom:10, borderRadius:4,
          background: fetchStatus.startsWith('error') ? 'rgba(192,57,43,0.12)' : 'rgba(30,134,73,0.12)',
          color: fetchStatus.startsWith('error') ? '#C0392B' : '#1E8449',
          border: `1px solid ${fetchStatus.startsWith('error') ? 'rgba(192,57,43,0.2)' : 'rgba(30,134,73,0.2)'}`,
        }}>
          {fetchStatus}
        </div>
      )}

      {/* Ticker tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:12 }}>
        {TICKERS.map((t, i) => (
          <button key={t}
            onClick={() => { setActiveTicker(i); setExpandedScenario(-1); }}
            style={{
              padding:'7px 20px',
              border:`${activeTicker===i?'1.5':'1'}px solid ${activeTicker===i?'var(--color-border-primary)':'var(--color-border-tertiary)'}`,
              borderRadius:8,
              background: activeTicker===i ? 'var(--color-background-elevated)' : 'var(--color-background-secondary)',
              color: activeTicker===i ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTicker===i ? 600 : 400,
              fontSize:13,
              transition:'all .1s',
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* Current position card */}
      <div style={{
        background: ai.color+'14', border:`1.5px solid ${ai.color}35`,
        borderRadius:10, padding:'12px 16px', marginBottom:14,
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:6 }}>
          <div>
            <span style={{ fontSize:10, fontWeight:600, color:ai.color, textTransform:'uppercase', letterSpacing:0.6 }}>
              {ai.zone}
            </span>
            <span style={{ fontSize:20, fontWeight:600, marginLeft:10, color:'var(--color-text-primary)' }}>
              Rp {(values[ticker.toLowerCase()+'Price']||0).toLocaleString()}
            </span>
          </div>
          <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>{ai.action}</div>
        </div>
      </div>

      {/* Scenario probability grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:4, marginBottom:14 }}>
        {SCENARIOS.map((s, i) => {
          const diff = probs[i] - BASE_PROBS[ticker][i];
          return (
            <div key={s} style={{
              background: S_COLORS[i]+'10', borderRadius:8, padding:'8px 4px',
              textAlign:'center', border:`1px solid ${S_COLORS[i]}22`,
            }}>
              <div style={{ fontSize:22, fontWeight:700, color:S_COLORS[i] }}>{probs[i]}%</div>
              <div style={{ fontSize:9, color:S_COLORS[i], lineHeight:1.3, marginTop:2 }}>{s}</div>
              {diff !== 0 && (
                <div style={{
                  fontSize:9, fontWeight:600, marginTop:2,
                  color: diff > 0 ? (i<2?'#1E8449':'#C0392B') : (i<2?'#C0392B':'#1E8449'),
                }}>
                  {diff > 0 ? '+' : ''}{diff}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Indicator sliders */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:10, fontWeight:600, color:'var(--color-text-tertiary)', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>
          Macro Indicators — auto-filled or adjust manually
        </div>

        {macroInds.map(ind => {
          const v = values[ind.id] ?? ind.default;
          const z = ind.isSelect
            ? (ind.zones.find(zone => v <= zone.max) || ind.zones[ind.zones.length-1])
            : getZone(ind, v);
          return (
            <div key={ind.id} style={{
              display:'grid', gridTemplateColumns:'120px 1fr 72px',
              gap:6, alignItems:'center',
              padding:'5px 10px', marginBottom:3,
              background:'var(--color-background-secondary)',
              borderRadius:5, borderLeft:`3px solid ${z.color}`,
            }}>
              <div style={{ fontSize:11, fontWeight:500, color:'var(--color-text-primary)' }}>{ind.name}</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                {ind.isSelect ? (
                  <select value={v} onChange={e => updateValue(ind.id, parseInt(e.target.value))} style={{ flex:1, fontSize:11 }}>
                    {ind.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <>
                    <input type="range"
                      min={ind.id==='foreignFlow' ? -8 : ind.thresholds[0].below * 0.7}
                      max={ind.id==='foreignFlow' ? 10  : ind.thresholds[ind.thresholds.length-1].below * (ind.thresholds[ind.thresholds.length-1].below > 100 ? 1 : 1.05)}
                      step={ind.step} value={v}
                      onChange={e => updateValue(ind.id, parseFloat(e.target.value))}
                      style={{ flex:1 }} />
                    <input type="number" value={v} step={ind.step}
                      onChange={e => updateValue(ind.id, parseFloat(e.target.value)||0)}
                      style={{ width:64, fontSize:11, textAlign:'right' }} />
                  </>
                )}
              </div>
              <div style={{ fontSize:10, fontWeight:600, color:z.color, textAlign:'right' }}>{z.label}</div>
            </div>
          );
        })}

        <div style={{ fontSize:10, fontWeight:600, color:'var(--color-text-tertiary)', margin:'10px 0 6px', textTransform:'uppercase', letterSpacing:0.5 }}>
          {ticker} Price
        </div>
        {tickerInds.map(ind => {
          const v = values[ind.id] ?? ind.default;
          const z = getZone(ind, v);
          return (
            <div key={ind.id} style={{
              display:'grid', gridTemplateColumns:'120px 1fr 72px',
              gap:6, alignItems:'center',
              padding:'5px 10px', marginBottom:3,
              background:'var(--color-background-secondary)',
              borderRadius:5, borderLeft:`3px solid ${z.color}`,
            }}>
              <div style={{ fontSize:11, fontWeight:500, color:'var(--color-text-primary)' }}>{ind.name} price</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <input type="range"
                  min={ind.thresholds[0].below * 0.8}
                  max={ind.thresholds[ind.thresholds.length-2].below * 1.1}
                  step={ind.step} value={v}
                  onChange={e => updateValue(ind.id, parseFloat(e.target.value))}
                  style={{ flex:1 }} />
                <input type="number" value={v} step={ind.step}
                  onChange={e => updateValue(ind.id, parseFloat(e.target.value)||0)}
                  style={{ width:72, fontSize:11, textAlign:'right' }} />
              </div>
              <div style={{ fontSize:10, fontWeight:600, color:z.color, textAlign:'right' }}>{z.label}</div>
            </div>
          );
        })}
      </div>

      {/* 12-month scenario accordion */}
      <div style={{ fontSize:10, fontWeight:600, color:'var(--color-text-tertiary)', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>
        {ticker} — 12-month scenarios
      </div>
      {SCENARIOS.map((s, i) => {
        const d = details[i];
        const isOpen = expandedScenario === i;
        return (
          <div key={s}
            onClick={() => setExpandedScenario(isOpen ? -1 : i)}
            style={{
              border:`${isOpen?'1.5':'1'}px solid ${isOpen ? S_COLORS[i]+'55' : 'var(--color-border-tertiary)'}`,
              borderRadius:8, padding:'9px 13px', marginBottom:4, cursor:'pointer',
              background: isOpen ? S_COLORS[i]+'08' : 'var(--color-background-secondary)',
              transition:'all .1s',
            }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:13, fontWeight:600, color:S_COLORS[i] }}>{s}</span>
                <span style={{ fontSize:11, padding:'1px 6px', borderRadius:3, background:S_COLORS[i]+'18', color:S_COLORS[i], fontWeight:600 }}>
                  {probs[i]}%
                </span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:12, fontWeight:500, color:'var(--color-text-primary)' }}>Rp {d.m12}</span>
                <span style={{ fontSize:11, fontWeight:600, color: d.ret.startsWith('+') ? '#1E8449' : '#C0392B' }}>{d.ret}</span>
                <span style={{ fontSize:10, color:'var(--color-text-secondary)', display:'inline-block', transform:isOpen?'rotate(90deg)':'none', transition:'transform .1s' }}>▶</span>
              </div>
            </div>
            {isOpen && (
              <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid var(--color-border-tertiary)' }}>
                <div style={{ fontSize:11, color:'var(--color-text-secondary)', marginBottom:4 }}>Key triggers for this scenario</div>
                <div style={{ fontSize:12, lineHeight:1.6, color:'var(--color-text-primary)' }}>{d.key}</div>
              </div>
            )}
          </div>
        );
      })}

      {/* History table */}
      {history.length > 1 && (
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:10, fontWeight:600, color:'var(--color-text-tertiary)', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>
            Snapshot history — last {Math.min(history.length, 7)} saves
          </div>
          <div style={{ overflowX:'auto' }}>
            <div style={{ display:'grid', gridTemplateColumns:'60px repeat(5,1fr) 60px 60px 60px', gap:3, fontSize:10, minWidth:440 }}>
              <div style={{ fontWeight:600, color:'var(--color-text-secondary)', padding:3 }}>Date</div>
              {SCENARIOS.map((s,i) => (
                <div key={s} style={{ fontWeight:600, color:S_COLORS[i], padding:3, textAlign:'center', fontSize:9 }}>
                  {s.split(' ')[0]}
                </div>
              ))}
              {['BBCA','BBRI','BMRI'].map(t => (
                <div key={t} style={{ fontWeight:600, color:'var(--color-text-secondary)', padding:3, textAlign:'center', fontSize:9 }}>{t}</div>
              ))}
              {history.slice(-7).map((entry, ei) => {
                const p = computeProbs(entry.values, ticker);
                const dt = new Date(entry.date);
                return (
                  <React.Fragment key={ei}>
                    <div style={{ padding:3, color:'var(--color-text-secondary)', fontSize:10 }}>
                      {dt.toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}
                    </div>
                    {p.map((prob, pi) => (
                      <div key={pi} style={{
                        padding:3, textAlign:'center', borderRadius:2,
                        background: S_COLORS[pi] + Math.round(prob*0.5).toString(16).padStart(2,'0'),
                        fontWeight:600, color:S_COLORS[pi], fontSize:10,
                      }}>
                        {prob}%
                      </div>
                    ))}
                    <div style={{ padding:3, textAlign:'center', fontSize:10, color:'var(--color-text-primary)' }}>
                      {(entry.values.bbcaPrice||0).toLocaleString()}
                    </div>
                    <div style={{ padding:3, textAlign:'center', fontSize:10, color:'var(--color-text-primary)' }}>
                      {(entry.values.bbriPrice||0).toLocaleString()}
                    </div>
                    <div style={{ padding:3, textAlign:'center', fontSize:10, color:'var(--color-text-primary)' }}>
                      {(entry.values.bmriPrice||0).toLocaleString()}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ fontSize:10, color:'var(--color-text-tertiary)', padding:'14px 0 4px', marginTop:10, lineHeight:1.6 }}>
        Tap "Fetch today's data" to auto-pull live market data via AI web search. Probabilities adjust automatically.
        "Save" records a snapshot for trend tracking. Moody's status is manual — update only on rating actions.
        Not financial advice.
      </div>
    </div>
  );
}
