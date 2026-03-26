// src/data/extraTickers.js
// Additional ticker data for BBNI (Bank Negara Indonesia) and BRIS (Bank Syariah Indonesia)
// Imported by Dashboard.jsx to extend the base BBCA/BBRI/BMRI set.

// ─── Ticker list ──────────────────────────────────────────────────────────────

export const EXTRA_TICKERS = ['BBNI', 'BRIS'];

// ─── Yahoo Finance symbols ────────────────────────────────────────────────────

export const EXTRA_YAHOO_SYMBOLS = {
  bbniPrice: 'BBNI.JK',
  brisPrice: 'BRIS.JK',
};

// ─── Base scenario probabilities ──────────────────────────────────────────────
// Order: [V-shape recovery, Gradual grind, Sideways chop, Extended bear, Full crisis]
// BBNI: diversified SOE bank — moderate upside/downside vs BBRI
// BRIS: Islamic bank — slightly higher base upside potential from structural growth

export const EXTRA_BASE_PROBS = {
  BBNI: [13, 36, 28, 17, 6],
  BRIS: [18, 35, 25, 15, 7],
};

// ─── Price indicator definitions ──────────────────────────────────────────────
// Mirrors the INDICATORS entry structure in Dashboard.jsx.
// Score arrays: [v-shape, gradual, sideways, extended-bear, full-crisis]
//
// BBNI price zones (Rp): Aggr. Buy <3,000 | Accumulate <3,800 | Fair <4,800 | Full ≥4,800
// BRIS price zones (Rp): Aggr. Buy <1,100 | Accumulate <1,500 | Fair <2,000 | Full ≥2,000

export const EXTRA_PRICE_INDICATORS = [
  {
    id: 'bbniPrice',
    name: 'BBNI',
    default: 4400,
    step: 25,
    ticker: 'BBNI',
    thresholds: [
      // Deep value / crisis entry
      { below: 2500,  scores: [0, 0, 0, 1, 3] },
      { below: 3000,  scores: [0, 0, 0, 2, 1] },
      // Aggressive buy zone
      { below: 3400,  scores: [0, 0, 1, 2, 0] },
      { below: 3800,  scores: [0, 1, 2, 0, 0] },
      // Accumulate / fair value transition
      { below: 4200,  scores: [0, 2, 1, 0, 0] },
      { below: 4800,  scores: [0, 1, 2, 0, 0] },
      // Fair → full
      { below: 5500,  scores: [1, 2, 0, 0, 0] },
      { below: 6000,  scores: [2, 1, 0, 0, 0] },
      { below: 99999, scores: [3, 1, 0, 0, 0] },
    ],
    zones: [
      { max: 3000,  label: 'Aggr. Buy',  color: '#C0392B' },
      { max: 3800,  label: 'Accumulate', color: '#D35400' },
      { max: 4800,  label: 'Fair',       color: '#1E8449' },
      { max: 99999, label: 'Full',       color: '#2874A6' },
    ],
  },
  {
    id: 'brisPrice',
    name: 'BRIS',
    default: 1800,
    step: 5,
    ticker: 'BRIS',
    thresholds: [
      // Deep value / crisis entry
      { below: 900,   scores: [0, 0, 0, 1, 3] },
      { below: 1100,  scores: [0, 0, 0, 2, 1] },
      // Aggressive buy zone
      { below: 1300,  scores: [0, 0, 1, 2, 0] },
      { below: 1500,  scores: [0, 1, 2, 0, 0] },
      // Accumulate / fair value transition
      { below: 1750,  scores: [0, 2, 1, 0, 0] },
      { below: 2000,  scores: [0, 1, 2, 0, 0] },
      // Fair → full
      { below: 2300,  scores: [1, 2, 0, 0, 0] },
      { below: 2600,  scores: [2, 1, 0, 0, 0] },
      { below: 99999, scores: [3, 1, 0, 0, 0] },
    ],
    zones: [
      { max: 1100,  label: 'Aggr. Buy',  color: '#C0392B' },
      { max: 1500,  label: 'Accumulate', color: '#D35400' },
      { max: 2000,  label: 'Fair',       color: '#1E8449' },
      { max: 99999, label: 'Full',       color: '#2874A6' },
    ],
  },
];

// ─── Scenario detail text ─────────────────────────────────────────────────────
// Same structure as SCENARIO_DETAILS in Dashboard.jsx.
// Order: [V-shape, Gradual grind, Sideways chop, Extended bear, Full crisis]
//
// BBNI: currently ~Rp 4,400 — price targets derived from historical P/BV bands
// BRIS: currently ~Rp 1,800 — Islamic bank, growth premium but thinner margin buffer

export const EXTRA_SCENARIO_DETAILS = {
  BBNI: [
    {
      m12: '5,800–6,800',
      ret: '+32% to +55%',
      key: 'BI cuts to 4.25%, IDR <16,000, corporate NPL improves, SOE governance reform, foreign net buy >Rp3T/mo',
    },
    {
      m12: '5,000–5,800',
      ret: '+14% to +32%',
      key: 'Loan growth 7–9%, NIM holds ~4.4%, IDR stable 16.5–17K, no rating action, dividend maintained',
    },
    {
      m12: '4,100–4,800',
      ret: '−7% to +9%',
      key: 'BI holds, corporate lending flat, NIM under pressure from rate stickiness, foreign flow neutral',
    },
    {
      m12: '3,200–4,100',
      ret: '−27% to −7%',
      key: 'SOE stress, corporate NPL >3%, NIM compression >60bps, Baa3 downgrade risk, IDR >18K',
    },
    {
      m12: '2,400–3,200',
      ret: '−45% to −27%',
      key: 'Sub-IG, systemic corporate defaults, BUMN recap required, BI emergency hike >7%, capital flight',
    },
  ],
  BRIS: [
    {
      m12: '2,500–3,000',
      ret: '+39% to +67%',
      key: 'Halal economy policy accelerates, Islamic finance market share >10%, BI dovish, merger synergies fully realized',
    },
    {
      m12: '2,100–2,600',
      ret: '+17% to +44%',
      key: 'Financing growth >12%, CASA improvement, cost of funds easing, sukuk market active, stable policy',
    },
    {
      m12: '1,650–2,000',
      ret: '−8% to +11%',
      key: 'Margin compression from BI Rate stickiness, financing growth slows to 7–8%, no new halal economy catalyst',
    },
    {
      m12: '1,250–1,650',
      ret: '−31% to −8%',
      key: 'Shariah NPF rises, cost of funds elevated, IDR >18K stresses trade-finance book, foreign outflow hits sukuk',
    },
    {
      m12: '900–1,200',
      ret: '−50% to −33%',
      key: 'Systemic liquidity stress, Islamic interbank market seizes, recapitalization, dividend eliminated, BI hike >7%',
    },
  ],
};
