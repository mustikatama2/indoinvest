/**
 * api/snapshots.js
 * GET  /api/snapshots?limit=90   → list latest snapshots
 * POST /api/snapshots            → save a new snapshot
 *
 * Uses Supabase REST API directly (no npm package required).
 * Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const TABLE  = 'indoinvest_snapshots';

function sbHeaders() {
  return {
    'Content-Type':  'application/json',
    'apikey':        SB_KEY,
    'Authorization': `Bearer ${SB_KEY}`,
    'Prefer':        'return=representation',
  };
}

function isReady() {
  return SB_URL && SB_KEY && SB_URL.startsWith('http');
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  // ── GET: list latest snapshots ──────────────────────────────────────────────
  if (req.method === 'GET') {
    if (!isReady()) {
      return res.status(200).json({ rows: [], source: 'nodb' });
    }
    const limit = Math.min(parseInt(req.query?.limit || '90', 10), 200);
    try {
      const r = await fetch(
        `${SB_URL}/rest/v1/${TABLE}?select=*&order=created_at.desc&limit=${limit}`,
        { headers: sbHeaders() }
      );
      if (!r.ok) {
        const err = await r.text();
        return res.status(500).json({ error: `Supabase GET failed: ${err}` });
      }
      const rows = await r.json();
      return res.status(200).json({ rows: rows.reverse(), source: 'db' }); // oldest-first for charting
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── POST: save snapshot ─────────────────────────────────────────────────────
  if (req.method === 'POST') {
    if (!isReady()) {
      // DB not configured — accept gracefully, client will use localStorage
      return res.status(200).json({ ok: true, source: 'nodb' });
    }
    const { values, probs, note, data_source } = req.body || {};
    if (!values || typeof values !== 'object') {
      return res.status(400).json({ error: 'Missing values' });
    }
    const payload = {
      values,
      probs:       probs || null,
      note:        note  || null,
      data_source: data_source || 'manual',
    };
    try {
      const r = await fetch(`${SB_URL}/rest/v1/${TABLE}`, {
        method:  'POST',
        headers: sbHeaders(),
        body:    JSON.stringify(payload),
      });
      if (!r.ok) {
        const err = await r.text();
        return res.status(500).json({ error: `Supabase POST failed: ${err}` });
      }
      const inserted = await r.json();
      return res.status(201).json({ ok: true, row: inserted[0] || null, source: 'db' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
