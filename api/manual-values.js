/**
 * api/manual-values.js
 * GET /api/manual-values               → fetch all manual field values
 * PUT /api/manual-values               → upsert one field { field_id, value }
 *
 * Fields: biRate | sbn10y | foreignFlow | moodys
 * Uses Supabase REST API directly (no npm package required).
 * Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const TABLE         = 'indoinvest_manual_values';
const HISTORY_TABLE = 'indoinvest_manual_history';

const ALLOWED_FIELDS = new Set(['biRate', 'sbn10y', 'foreignFlow', 'moodys']);

function sbHeaders() {
  return {
    'Content-Type':  'application/json',
    'apikey':        SB_KEY,
    'Authorization': `Bearer ${SB_KEY}`,
    'Prefer':        'return=representation,resolution=merge-duplicates',
  };
}

function isReady() {
  return SB_URL && SB_KEY && SB_URL.startsWith('http');
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  // ── GET: all manual values ──────────────────────────────────────────────────
  if (req.method === 'GET') {
    if (!isReady()) {
      return res.status(200).json({ rows: [], source: 'nodb' });
    }
    try {
      const r = await fetch(
        `${SB_URL}/rest/v1/${TABLE}?select=field_id,value,updated_at`,
        { headers: { ...sbHeaders(), Prefer: 'return=representation' } }
      );
      if (!r.ok) {
        const err = await r.text();
        return res.status(500).json({ error: `Supabase GET failed: ${err}` });
      }
      const rows = await r.json();
      return res.status(200).json({ rows, source: 'db' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── PUT: upsert one field ───────────────────────────────────────────────────
  if (req.method === 'PUT') {
    if (!isReady()) {
      return res.status(200).json({ ok: true, source: 'nodb' });
    }
    const { field_id, value } = req.body || {};
    if (!field_id || !ALLOWED_FIELDS.has(field_id)) {
      return res.status(400).json({ error: `Invalid field_id. Allowed: ${[...ALLOWED_FIELDS].join(', ')}` });
    }
    if (value === undefined || value === null || isNaN(Number(value))) {
      return res.status(400).json({ error: 'value must be a number' });
    }
    const payload = {
      field_id,
      value:      Number(value),
      updated_at: new Date().toISOString(),
    };
    try {
      // 1. Get current value for old_value in history log
      let oldValue = null;
      try {
        const prev = await fetch(`${SB_URL}/rest/v1/${TABLE}?field_id=eq.${encodeURIComponent(field_id)}&select=value`, {
          headers: { ...sbHeaders(), Prefer: 'return=representation' },
        });
        if (prev.ok) {
          const rows = await prev.json();
          oldValue = rows[0]?.value ?? null;
        }
      } catch {}

      // 2. Upsert current value
      const r = await fetch(`${SB_URL}/rest/v1/${TABLE}`, {
        method:  'POST', // Supabase upsert uses POST with Prefer: merge-duplicates
        headers: sbHeaders(),
        body:    JSON.stringify(payload),
      });
      if (!r.ok) {
        const err = await r.text();
        return res.status(500).json({ error: `Supabase upsert failed: ${err}` });
      }
      const row = await r.json();

      // 3. Log to history table (fire-and-forget — don't block response)
      if (oldValue === null || Number(oldValue) !== Number(value)) {
        fetch(`${SB_URL}/rest/v1/${HISTORY_TABLE}`, {
          method:  'POST',
          headers: { ...sbHeaders(), Prefer: 'return=minimal' },
          body: JSON.stringify({
            field_id,
            old_value:  oldValue !== null ? Number(oldValue) : null,
            new_value:  Number(value),
            changed_at: new Date().toISOString(),
          }),
        }).catch(() => {});
      }

      return res.status(200).json({ ok: true, row: row[0] || null, source: 'db' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
