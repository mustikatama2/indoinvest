/**
 * /api/fetch-market
 * Fetches live Indonesian market data.
 *
 * Strategy (most-reliable-first):
 *  1. Yahoo Finance v8 chart API (per-symbol, parallel) — less rate-limited than v7 batch
 *  2. stooq.com CSV fallback for JK stocks (reliable, no auth)
 *
 * Auto fields: BBCA · BBRI · BMRI · BBNI · BRIS prices · IHSG · USD/IDR · Brent
 * Manual fields: BI Rate · 10Y SBN yield · Foreign net flow · Moody's
 */

// ─── Symbols ──────────────────────────────────────────────────────────────────

const YAHOO_SYMBOLS = {
  bbcaPrice: 'BBCA.JK',
  bbriPrice: 'BBRI.JK',
  bmriPrice: 'BMRI.JK',
  bbniPrice: 'BBNI.JK',
  brisPrice: 'BRIS.JK',
  ihsg:      '^JKSE',
  fx:        'IDR=X',   // USD/IDR
  oil:       'BZ=F',    // Brent crude
};

const STOOQ_SYMBOLS = {
  bbcaPrice: 'bbca.jk',
  bbriPrice: 'bbri.jk',
  bmriPrice: 'bmri.jk',
  bbniPrice: 'bbni.jk',
  brisPrice: 'bris.jk',
  ihsg:      '^jkse',
};

// ─── Headers ──────────────────────────────────────────────────────────────────

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json,text/html,*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Referer': 'https://finance.yahoo.com/',
  'Origin': 'https://finance.yahoo.com',
};

// ─── Yahoo v8 chart (per-symbol, returns regularMarketPrice) ─────────────────

async function yahooChart(symbol) {
  const base = Math.random() > 0.5 ? 'query1' : 'query2';
  const url  = `https://${base}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d&includePrePost=false`;
  const resp = await fetch(url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(6000) });
  if (resp.status === 429) throw new Error('Yahoo 429');
  if (!resp.ok) throw new Error(`Yahoo ${resp.status}`);
  const json = await resp.json();
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error('No meta');
  return meta.regularMarketPrice ?? meta.chartPreviousClose ?? null;
}

// ─── Yahoo v7 batch quote (original approach, as tertiary) ───────────────────

async function yahooV7Batch(fields) {
  const symbols = fields.map(f => YAHOO_SYMBOLS[f]);
  const base    = 'query2';
  const url     = `https://${base}.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(','))}&lang=en-US&region=US`;
  const resp    = await fetch(url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(8000) });
  if (!resp.ok) throw new Error(`Yahoo v7 ${resp.status}`);
  const json    = await resp.json();
  const results = json?.quoteResponse?.result;
  if (!Array.isArray(results) || results.length === 0) throw new Error('Empty batch result');
  const bySymbol = {};
  for (const q of results) bySymbol[q.symbol] = q.regularMarketPrice ?? q.postMarketPrice ?? null;
  const out = {};
  fields.forEach((f, i) => { out[f] = bySymbol[symbols[i]] ?? null; });
  return out;
}

// ─── stooq CSV fallback (JK stocks only) ─────────────────────────────────────

async function stooqPrice(field) {
  const sym = STOOQ_SYMBOLS[field];
  if (!sym) return null;
  const url  = `https://stooq.com/q/l/?s=${encodeURIComponent(sym)}&f=sd2t2ohlcv&h&e=csv`;
  const resp = await fetch(url, {
    headers: { 'User-Agent': BROWSER_HEADERS['User-Agent'] },
    signal: AbortSignal.timeout(5000),
  });
  if (!resp.ok) return null;
  const text  = await resp.text();
  const lines = text.trim().split('\n');
  if (lines.length < 2) return null;
  // CSV header: Symbol,Date,Time,Open,High,Low,Close,Volume
  const cols  = lines[1].split(',');
  const close = parseFloat(cols[6]); // Close is index 6
  return isNaN(close) || close === 0 ? null : close;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const fieldNames = Object.keys(YAHOO_SYMBOLS);
  const result     = {};
  let   marketState = 'UNKNOWN';

  // ── Step 1: Try Yahoo v8 chart API per-symbol in parallel ────────────────
  const yahooResults = await Promise.allSettled(
    fieldNames.map(async f => {
      const price = await yahooChart(YAHOO_SYMBOLS[f]);
      return { field: f, price };
    })
  );

  let yahooFailed = 0;
  for (const r of yahooResults) {
    if (r.status === 'fulfilled' && r.value.price != null) {
      result[r.value.field] = r.value.price;
    } else {
      yahooFailed++;
    }
  }

  // ── Step 2: For any failed fields, try v7 batch ──────────────────────────
  const missingAfterV8 = fieldNames.filter(f => result[f] == null);
  if (missingAfterV8.length > 0) {
    try {
      const batchResult = await yahooV7Batch(missingAfterV8);
      Object.assign(result, batchResult);
    } catch (_) {
      // v7 also failed — fall through to stooq
    }
  }

  // ── Step 3: stooq fallback for any still-missing JK fields ───────────────
  const missingJk = fieldNames.filter(f => result[f] == null && STOOQ_SYMBOLS[f]);
  if (missingJk.length > 0) {
    const stooqResults = await Promise.allSettled(
      missingJk.map(async f => ({ field: f, price: await stooqPrice(f) }))
    );
    for (const r of stooqResults) {
      if (r.status === 'fulfilled' && r.value.price != null) {
        result[r.value.field] = r.value.price;
      }
    }
  }

  // ── Error: all sources failed ─────────────────────────────────────────────
  const successCount = fieldNames.filter(f => result[f] != null).length;
  if (successCount === 0) {
    return res.status(502).json({
      error: 'All data sources failed (Yahoo 429 + stooq timeout). Try again in 60s.',
    });
  }

  // ── Market state from IHSG if available ──────────────────────────────────
  // We can't easily get marketState from v8 chart in the simplified path,
  // so default to POST/CLOSED based on JKT time (07:00–15:30 WIB = REGULAR)
  const nowJkt    = new Date(Date.now() + 7 * 3600_000);
  const hhmm      = nowJkt.getUTCHours() * 100 + nowJkt.getUTCMinutes();
  const dayOfWeek = nowJkt.getUTCDay(); // 0=Sun, 6=Sat
  marketState = (dayOfWeek >= 1 && dayOfWeek <= 5 && hhmm >= 700 && hhmm <= 1530)
    ? 'REGULAR'
    : 'CLOSED';

  const now = new Date();
  return res.status(200).json({
    // Auto-fetched fields
    bbcaPrice: result.bbcaPrice ?? null,
    bbriPrice: result.bbriPrice ?? null,
    bmriPrice: result.bmriPrice ?? null,
    bbniPrice: result.bbniPrice ?? null,
    brisPrice: result.brisPrice ?? null,
    ihsg:      result.ihsg      ?? null,
    fx:        result.fx        ?? null,
    oil:       result.oil       ?? null,
    // Manual (null = frontend keeps current)
    sbn10y: null, biRate: null, foreignFlow: null, moodys: null,
    // Meta
    date:       now.toISOString().split('T')[0],
    fetchedAt:  now.toISOString(),
    marketState,
    fieldsOk:   successCount,
    autoFields: ['bbcaPrice','bbriPrice','bmriPrice','bbniPrice','brisPrice','ihsg','fx','oil'],
    source:     successCount >= 6 ? 'Yahoo Finance' : `Yahoo partial (${successCount}/8) + stooq`,
  });
}
