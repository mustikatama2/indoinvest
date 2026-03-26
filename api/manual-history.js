/**
 * api/manual-history.js
 * GET /api/manual-history?field_id=biRate&limit=20
 * Returns chronological change log for a manual field.
 */

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const TABLE  = 'indoinvest_manual_history';

function sbHeaders() {
  return {
    'Content-Type':  'application/json',
    'apikey':        SB_KEY,
    'Authorization': `Bearer ${SB_KEY}`,
  };
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  if (!SB_URL || !SB_KEY) return res.status(200).json({ rows: [], source: 'nodb' });

  const fieldId = req.query?.field_id || null;
  const limit   = Math.min(parseInt(req.query?.limit || '20', 10), 100);

  let url = `${SB_URL}/rest/v1/${TABLE}?select=*&order=changed_at.desc&limit=${limit}`;
  if (fieldId) url += `&field_id=eq.${encodeURIComponent(fieldId)}`;

  try {
    const r = await fetch(url, { headers: sbHeaders() });
    if (!r.ok) return res.status(500).json({ error: await r.text() });
    const rows = await r.json();
    return res.status(200).json({ rows, source: 'db' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
