// src/data/catalysts.js
// Static catalyst calendar — update manually when schedules change.

export const CATALYST_TYPES = {
  rdg_bi:       { label: 'RDG BI',    color: '#2874A6', icon: '🏦' },
  earnings:     { label: 'Earnings',  color: '#1E8449', icon: '📊' },
  fomc:         { label: 'FOMC',      color: '#D35400', icon: '🇺🇸' },
  macro_id:     { label: 'Macro ID',  color: '#8a5cf6', icon: '📈' },
  moody_window: { label: "Moody's",   color: '#C0392B', icon: '⚠️' },
  dividend:     { label: 'Dividend',  color: '#f0c200', icon: '💰' },
};

// Each event: { date: 'YYYY-MM-DD', type, title, impact: 'high'|'medium'|'low', ticker?: string, note?: string }
export const CATALYSTS = [
  // ── RDG BI 2025 (remaining scheduled meetings) ──
  { date: '2025-04-23', type: 'rdg_bi', title: 'RDG BI — Rate Decision', impact: 'high' },
  { date: '2025-05-21', type: 'rdg_bi', title: 'RDG BI — Rate Decision', impact: 'high' },
  { date: '2025-06-18', type: 'rdg_bi', title: 'RDG BI — Rate Decision', impact: 'high' },
  { date: '2025-07-16', type: 'rdg_bi', title: 'RDG BI — Rate Decision', impact: 'high' },
  { date: '2025-08-20', type: 'rdg_bi', title: 'RDG BI — Rate Decision', impact: 'high' },
  { date: '2025-09-17', type: 'rdg_bi', title: 'RDG BI — Rate Decision', impact: 'high' },
  { date: '2025-10-15', type: 'rdg_bi', title: 'RDG BI — Rate Decision', impact: 'high' },
  { date: '2025-11-19', type: 'rdg_bi', title: 'RDG BI — Rate Decision', impact: 'high' },
  { date: '2025-12-17', type: 'rdg_bi', title: 'RDG BI — Rate Decision', impact: 'high' },

  // ── RDG BI 2026 ──
  { date: '2026-01-21', type: 'rdg_bi', title: 'RDG BI — Rate Decision', impact: 'high' },
  { date: '2026-02-18', type: 'rdg_bi', title: 'RDG BI — Rate Decision', impact: 'high' },
  { date: '2026-03-18', type: 'rdg_bi', title: 'RDG BI — Rate Decision', impact: 'high' },
  { date: '2026-04-22', type: 'rdg_bi', title: 'RDG BI — Rate Decision', impact: 'high' },
  { date: '2026-05-20', type: 'rdg_bi', title: 'RDG BI — Rate Decision', impact: 'high' },
  { date: '2026-06-17', type: 'rdg_bi', title: 'RDG BI — Rate Decision', impact: 'high' },

  // ── FOMC 2025 ──
  { date: '2025-05-07', type: 'fomc', title: 'FOMC — Fed Rate Decision', impact: 'high', note: 'Affects IDR/USD and foreign flow' },
  { date: '2025-06-18', type: 'fomc', title: 'FOMC — Fed Rate Decision', impact: 'high' },
  { date: '2025-07-30', type: 'fomc', title: 'FOMC — Fed Rate Decision', impact: 'high' },
  { date: '2025-09-17', type: 'fomc', title: 'FOMC — Fed Rate Decision', impact: 'high' },
  { date: '2025-11-05', type: 'fomc', title: 'FOMC — Fed Rate Decision', impact: 'high' },
  { date: '2025-12-17', type: 'fomc', title: 'FOMC — Fed Rate Decision', impact: 'high' },

  // ── FOMC 2026 ──
  { date: '2026-01-28', type: 'fomc', title: 'FOMC — Fed Rate Decision', impact: 'high' },
  { date: '2026-03-18', type: 'fomc', title: 'FOMC — Fed Rate Decision', impact: 'high' },
  { date: '2026-05-06', type: 'fomc', title: 'FOMC — Fed Rate Decision', impact: 'high' },

  // ── Earnings Q1 2025 results (typically April/May) ──
  { date: '2025-04-25', type: 'earnings', title: 'BBCA Q1 2025 Results', impact: 'high',   ticker: 'BBCA' },
  { date: '2025-04-28', type: 'earnings', title: 'BBRI Q1 2025 Results', impact: 'high',   ticker: 'BBRI' },
  { date: '2025-04-29', type: 'earnings', title: 'BMRI Q1 2025 Results', impact: 'high',   ticker: 'BMRI' },
  { date: '2025-04-30', type: 'earnings', title: 'BBNI Q1 2025 Results', impact: 'high',   ticker: 'BBNI' },
  { date: '2025-05-05', type: 'earnings', title: 'BRIS Q1 2025 Results', impact: 'medium', ticker: 'BRIS' },

  // ── Earnings Q2 2025 results (typically July/Aug) ──
  { date: '2025-07-25', type: 'earnings', title: 'BBCA Q2 2025 Results', impact: 'high',   ticker: 'BBCA' },
  { date: '2025-07-28', type: 'earnings', title: 'BBRI Q2 2025 Results', impact: 'high',   ticker: 'BBRI' },
  { date: '2025-07-29', type: 'earnings', title: 'BMRI Q2 2025 Results', impact: 'high',   ticker: 'BMRI' },
  { date: '2025-07-30', type: 'earnings', title: 'BBNI Q2 2025 Results', impact: 'high',   ticker: 'BBNI' },
  { date: '2025-08-04', type: 'earnings', title: 'BRIS Q2 2025 Results', impact: 'medium', ticker: 'BRIS' },

  // ── Earnings Q3 2025 results (typically Oct/Nov) ──
  { date: '2025-10-27', type: 'earnings', title: 'BBCA Q3 2025 Results', impact: 'high',   ticker: 'BBCA' },
  { date: '2025-10-29', type: 'earnings', title: 'BBRI Q3 2025 Results', impact: 'high',   ticker: 'BBRI' },
  { date: '2025-10-30', type: 'earnings', title: 'BMRI Q3 2025 Results', impact: 'high',   ticker: 'BMRI' },
  { date: '2025-10-31', type: 'earnings', title: 'BBNI Q3 2025 Results', impact: 'high',   ticker: 'BBNI' },
  { date: '2025-11-05', type: 'earnings', title: 'BRIS Q3 2025 Results', impact: 'medium', ticker: 'BRIS' },

  // ── Earnings FY 2025 results (typically Feb/Mar 2026) ──
  { date: '2026-02-20', type: 'earnings', title: 'BBCA FY 2025 Results', impact: 'high',   ticker: 'BBCA' },
  { date: '2026-02-24', type: 'earnings', title: 'BBRI FY 2025 Results', impact: 'high',   ticker: 'BBRI' },
  { date: '2026-02-25', type: 'earnings', title: 'BMRI FY 2025 Results', impact: 'high',   ticker: 'BMRI' },
  { date: '2026-02-26', type: 'earnings', title: 'BBNI FY 2025 Results', impact: 'high',   ticker: 'BBNI' },
  { date: '2026-03-04', type: 'earnings', title: 'BRIS FY 2025 Results', impact: 'medium', ticker: 'BRIS' },

  // ── Key Macro Indonesia ──
  { date: '2025-05-02', type: 'macro_id', title: 'BPS CPI April 2025',   impact: 'medium' },
  { date: '2025-05-05', type: 'macro_id', title: 'BPS GDP Q1 2025',      impact: 'high',   note: 'Key growth read for rate path' },
  { date: '2025-06-02', type: 'macro_id', title: 'BPS CPI May 2025',     impact: 'medium' },
  { date: '2025-07-01', type: 'macro_id', title: 'BPS CPI June 2025',    impact: 'medium' },
  { date: '2025-08-01', type: 'macro_id', title: 'BPS CPI July 2025',    impact: 'medium' },
  { date: '2025-08-05', type: 'macro_id', title: 'BPS GDP Q2 2025',      impact: 'high' },
  { date: '2025-09-01', type: 'macro_id', title: 'BPS CPI August 2025',  impact: 'medium' },
  { date: '2025-10-01', type: 'macro_id', title: 'BPS CPI September 2025', impact: 'medium' },
  { date: '2025-11-05', type: 'macro_id', title: 'BPS GDP Q3 2025',      impact: 'high' },
  { date: '2025-12-01', type: 'macro_id', title: 'BPS CPI November 2025', impact: 'medium' },
  { date: '2026-02-05', type: 'macro_id', title: 'BPS GDP Q4 2025',      impact: 'high',   note: 'Full-year 2025 growth final read' },

  // ── Moody's review window ──
  { date: '2025-06-01', type: 'moody_window', title: "Moody's Mid-Year Review Window",  impact: 'high', note: "Baa2 negative watch — downgrade risk elevated" },
  { date: '2025-11-01', type: 'moody_window', title: "Moody's Year-End Review Window",  impact: 'high' },
  { date: '2026-06-01', type: 'moody_window', title: "Moody's Mid-Year Review Window",  impact: 'high' },

  // ── Dividends (approx ex-dates) ──
  { date: '2025-05-15', type: 'dividend', title: 'BBCA Dividend Ex-Date (est.)', impact: 'medium', ticker: 'BBCA' },
  { date: '2025-05-20', type: 'dividend', title: 'BBRI Dividend Ex-Date (est.)', impact: 'medium', ticker: 'BBRI' },
  { date: '2025-05-22', type: 'dividend', title: 'BMRI Dividend Ex-Date (est.)', impact: 'medium', ticker: 'BMRI' },
  { date: '2025-05-27', type: 'dividend', title: 'BBNI Dividend Ex-Date (est.)', impact: 'medium', ticker: 'BBNI' },
  { date: '2025-06-10', type: 'dividend', title: 'BRIS Dividend Ex-Date (est.)', impact: 'low',    ticker: 'BRIS' },
];
