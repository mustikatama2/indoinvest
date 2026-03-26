/**
 * src/lib/indicators.js
 * Single source of truth for all indicator definitions, constants, and pure
 * computation functions. Imported by Dashboard.jsx, CompareView.jsx, etc.
 */

import {
  EXTRA_TICKERS,
  EXTRA_BASE_PROBS,
  EXTRA_PRICE_INDICATORS,
  EXTRA_SCENARIO_DETAILS,
} from '../data/extraTickers.js';

// ─── Constants ────────────────────────────────────────────────────────────────

export const TICKERS   = ['BBCA', 'BBRI', 'BMRI', ...EXTRA_TICKERS];
export const SCENARIOS = ['V-shape recovery', 'Gradual grind', 'Sideways chop', 'Extended bear', 'Full crisis'];
export const S_COLORS  = ['#1E8449', '#2874A6', '#D35400', '#C0392B', '#7B241C'];

export const BASE_PROBS = {
  BBCA: [15, 40, 25, 15, 5],
  BBRI: [12, 35, 28, 18, 7],
  BMRI: [15, 38, 27, 15, 5],
  ...EXTRA_BASE_PROBS,
};

export const AUTO_FIELDS   = new Set(['bbcaPrice','bbriPrice','bmriPrice','bbniPrice','brisPrice','ihsg','fx','oil']);
export const MANUAL_FIELDS = new Set(['sbn10y','biRate','foreignFlow','moodys']);

export const MANUAL_HINTS = {
  sbn10y:      'Updated daily — check DJPPR or Investing.com',
  biRate:      'Changed at RDG BI meetings (~8×/yr) — check bi.go.id',
  foreignFlow: 'Monthly IDX data — check idx.co.id/berita/statistik',
  moodys:      "Rating actions only — update on official Moody's announcements",
};

// ─── Macro Indicators ─────────────────────────────────────────────────────────

export const MACRO_INDICATORS = [
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

// ─── Price Indicators ─────────────────────────────────────────────────────────

export const PRICE_INDICATORS = [
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

export const INDICATORS = [...MACRO_INDICATORS, ...PRICE_INDICATORS];

// ─── Scenario Details ─────────────────────────────────────────────────────────

export const SCENARIO_DETAILS = {
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

// ─── Pure helper functions ────────────────────────────────────────────────────

export function getZone(ind, val) {
  for (const z of ind.zones) { if (val <= z.max) return z; }
  return ind.zones[ind.zones.length - 1];
}

export function getScores(ind, val) {
  if (ind.isSelect) {
    const o = ind.options.find(opt => opt.value === val);
    return o ? o.scores : [0,0,1,0,0];
  }
  for (const t of ind.thresholds) { if (val < t.below) return t.scores; }
  return ind.thresholds[ind.thresholds.length - 1].scores;
}

export function computeProbs(values, ticker) {
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

export function getAction(ticker, values) {
  const pk = ticker.toLowerCase() + 'Price';
  const price = values[pk] || 0;
  const ind = INDICATORS.find(i => i.id === pk);
  if (!ind) return { zone: '?', color: '#888', action: '' };
  const z = getZone(ind, price);
  const actions = {
    'Aggr. Buy':  'Deploy 3–4× tranche',
    'Accumulate': 'Normal tranches',
    'Fair':       'Hold',
    'Full':       'Trim 10–20%',
  };
  return { zone: z.label, color: z.color, action: actions[z.label] || '' };
}

export function computeHealthScore(values) {
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

export function healthLabel(score) {
  if (score >= 65) return { label:'Constructive', color:'#1E8449' };
  if (score >= 45) return { label:'Neutral',      color:'#D35400' };
  if (score >= 30) return { label:'Stressed',     color:'#C0392B' };
  return               { label:'Crisis Mode',   color:'#7B241C' };
}

export function defaultValues() {
  const d = {};
  INDICATORS.forEach(i => { d[i.id] = i.default; });
  return d;
}
