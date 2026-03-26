/**
 * /api/fetch-market
 * Fetches live Indonesian market data from Yahoo Finance (free, no API key).
 * Auto fields: BBCA, BBRI, BMRI prices · IHSG · USD/IDR · Brent crude
 * Manual fields: BI Rate · 10Y SBN yield · Foreign net flow · Moody's
 */

const SYMBOLS = {
  bbcaPrice: 'BBCA.JK',
  bbriPrice: 'BBRI.JK',
  bmriPrice: 'BMRI.JK',
  ihsg:      '^JKSE',
  fx:        'IDR=X',    // USD/IDR — regularMarketPrice = IDR per 1 USD
  oil:       'BZ=F',     // Brent crude in USD
};

const YAHOO_URL =
  'https://query1.finance.yahoo.com/v7/finance/quote?symbols=' +
  encodeURIComponent(Object.values(SYMBOLS).join(',')) +
  '&lang=en-US&region=US&corsDomain=finance.yahoo.com';

const FALLBACK_URL =
  'https://query2.finance.yahoo.com/v7/finance/quote?symbols=' +
  encodeURIComponent(Object.values(SYMBOLS).join(',')) +
  '&lang=en-US&region=US';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function fetchYahoo(url) {
  const resp = await fetch(url, { headers: HEADERS });
  if (!resp.ok) throw new Error(`Yahoo ${resp.status}`);
  const json = await resp.json();
  const results = json?.quoteResponse?.result;
  if (!Array.isArray(results) || results.length === 0)
    throw new Error('Empty result from Yahoo Finance');
  return results;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let quotes;
  try {
    quotes = await fetchYahoo(YAHOO_URL);
  } catch (e1) {
    try {
      quotes = await fetchYahoo(FALLBACK_URL);
    } catch (e2) {
      return res.status(502).json({ error: `Yahoo Finance unavailable: ${e2.message}` });
    }
  }

  // Map symbol → quote
  const bySymbol = {};
  for (const q of quotes) bySymbol[q.symbol] = q;

  const get = (field) => {
    const sym = SYMBOLS[field];
    const q = bySymbol[sym];
    if (!q) return null;
    // Use regularMarketPrice; fall back to postMarketPrice if after hours
    return q.regularMarketPrice ?? q.postMarketPrice ?? null;
  };

  const now = new Date();
  const date = now.toISOString().split('T')[0];

  // Market status
  const jkseQuote = bySymbol['^JKSE'];
  const marketState = jkseQuote?.marketState || 'UNKNOWN'; // REGULAR | PRE | POST | CLOSED

  const result = {
    // ---- Auto-fetched (Yahoo Finance) ----
    bbcaPrice: get('bbcaPrice'),
    bbriPrice: get('bbriPrice'),
    bmriPrice: get('bmriPrice'),
    ihsg:      get('ihsg'),
    fx:        get('fx'),
    oil:       get('oil'),

    // ---- Manual fields (return null → frontend keeps current value) ----
    sbn10y:      null,
    biRate:      null,
    foreignFlow: null,
    moodys:      null,

    // ---- Meta ----
    date,
    marketState,
    autoFields: ['bbcaPrice', 'bbriPrice', 'bmriPrice', 'ihsg', 'fx', 'oil'],
    manualFields: ['sbn10y', 'biRate', 'foreignFlow', 'moodys'],
    fetchedAt: now.toISOString(),
    source: 'Yahoo Finance',

    // ---- Per-symbol debug (for troubleshooting) ----
    _debug: Object.fromEntries(
      Object.entries(SYMBOLS).map(([field, sym]) => [
        field,
        { symbol: sym, price: get(field), state: bySymbol[sym]?.marketState },
      ])
    ),
  };

  return res.status(200).json(result);
}
