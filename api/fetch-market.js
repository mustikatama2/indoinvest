/**
 * /api/fetch-market
 * Fetches live Indonesian market data from Yahoo Finance (free, no API key).
 * Auto fields: BBCA · BBRI · BMRI · BBNI · BRIS prices · IHSG · USD/IDR · Brent crude
 * Manual fields: BI Rate · 10Y SBN yield · Foreign net flow · Moody's
 */

const SYMBOLS = {
  bbcaPrice: 'BBCA.JK',
  bbriPrice: 'BBRI.JK',
  bmriPrice: 'BMRI.JK',
  bbniPrice: 'BBNI.JK',
  brisPrice: 'BRIS.JK',
  ihsg:      '^JKSE',
  fx:        'IDR=X',   // USD/IDR — regularMarketPrice = IDR per 1 USD
  oil:       'BZ=F',    // Brent crude in USD
};

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function fetchYahoo(base) {
  const url = `${base}/v7/finance/quote?symbols=${encodeURIComponent(Object.values(SYMBOLS).join(','))}&lang=en-US&region=US`;
  const resp = await fetch(url, { headers: HEADERS });
  if (!resp.ok) throw new Error(`Yahoo ${resp.status}`);
  const json = await resp.json();
  const results = json?.quoteResponse?.result;
  if (!Array.isArray(results) || results.length === 0) throw new Error('Empty result');
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
    quotes = await fetchYahoo('https://query1.finance.yahoo.com');
  } catch {
    try {
      quotes = await fetchYahoo('https://query2.finance.yahoo.com');
    } catch (e2) {
      return res.status(502).json({ error: `Yahoo Finance unavailable: ${e2.message}` });
    }
  }

  const bySymbol = {};
  for (const q of quotes) bySymbol[q.symbol] = q;

  const get = (field) => {
    const q = bySymbol[SYMBOLS[field]];
    return q ? (q.regularMarketPrice ?? q.postMarketPrice ?? null) : null;
  };

  const now = new Date();
  return res.status(200).json({
    // Auto-fetched
    bbcaPrice: get('bbcaPrice'),
    bbriPrice: get('bbriPrice'),
    bmriPrice: get('bmriPrice'),
    bbniPrice: get('bbniPrice'),
    brisPrice: get('brisPrice'),
    ihsg:      get('ihsg'),
    fx:        get('fx'),
    oil:       get('oil'),
    // Manual (null → frontend keeps current value)
    sbn10y: null, biRate: null, foreignFlow: null, moodys: null,
    // Meta
    date:        now.toISOString().split('T')[0],
    fetchedAt:   now.toISOString(),
    marketState: bySymbol['^JKSE']?.marketState || 'UNKNOWN',
    autoFields:  ['bbcaPrice','bbriPrice','bmriPrice','bbniPrice','brisPrice','ihsg','fx','oil'],
    source:      'Yahoo Finance',
  });
}
