/**
 * src/lib/db.js
 * Database-first client for IndoInvest.
 *
 * All read operations try the API first, fall back to localStorage.
 * All write operations write to both API and localStorage.
 *
 * localStorage format (unchanged for backward compatibility):
 *   key: 'indoinvest-v2' → { current, history, lastUpdate, manualValues }
 */

const STORAGE_KEY = 'indoinvest-v2';

// ─── localStorage helpers ──────────────────────────────────────────────────────

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {}; } catch { return {}; }
}

function saveLocal(patch) {
  try {
    const existing = loadLocal();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...patch }));
  } catch {}
}

// ─── Snapshots ─────────────────────────────────────────────────────────────────

/**
 * Load snapshot history.
 * Returns array of { id?, created_at, values, probs?, note?, data_source? }
 * sorted oldest → newest (for charting).
 */
export async function loadSnapshots(limit = 90) {
  try {
    const r = await fetch(`/api/snapshots?limit=${limit}`);
    if (r.ok) {
      const { rows, source } = await r.json();
      if (source === 'db' && Array.isArray(rows) && rows.length > 0) {
        // Normalise: ensure each row has a `date` alias for backward-compat
        const normalised = rows.map(row => ({
          ...row,
          date: row.created_at ?? row.date,
        }));
        // Also update localStorage cache
        saveLocal({ history: normalised });
        return normalised;
      }
    }
  } catch {
    // Network error — fall through to localStorage
  }
  // localStorage fallback
  const local = loadLocal();
  return local.history || [];
}

/**
 * Save a snapshot.
 * @param {object} values  - indicator values map
 * @param {object} probs   - computed probs per ticker { BBCA:[...], ... }
 * @param {string} note    - optional user note
 * @param {string} dataSource - 'auto' | 'manual'
 * @returns {object} saved entry (with id if DB succeeded)
 */
export async function saveSnapshot(values, probs, note = '', dataSource = 'manual') {
  const now = new Date().toISOString();
  const entry = {
    date:        now,
    created_at:  now,
    values,
    probs:       probs || null,
    note:        note  || null,
    data_source: dataSource,
  };

  // Persist to DB (fire-and-forget — don't block UI on DB latency)
  fetch('/api/snapshots', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ values, probs, note: note || null, data_source: dataSource }),
  }).catch(() => {}); // silent on network error

  // Always update localStorage immediately (primary UI source)
  const local = loadLocal();
  const history = [...(local.history || []), entry].slice(-90);
  saveLocal({ current: values, history, lastUpdate: now });

  return entry;
}

// ─── Manual values ─────────────────────────────────────────────────────────────

/**
 * Load manual indicator values from DB, falling back to localStorage defaults.
 * Returns a flat map: { biRate: 5.75, sbn10y: 6.40, ... }
 */
export async function loadManualValues() {
  try {
    const r = await fetch('/api/manual-values');
    if (r.ok) {
      const { rows, source } = await r.json();
      if (source === 'db' && Array.isArray(rows) && rows.length > 0) {
        const map = {};
        rows.forEach(row => { map[row.field_id] = Number(row.value); });
        // Cache to localStorage
        saveLocal({ manualValues: map });
        return map;
      }
    }
  } catch {}
  // localStorage fallback
  const local = loadLocal();
  return local.manualValues || {};
}

/**
 * Persist a single manual field update.
 * Updates both DB and localStorage immediately.
 * @param {string} fieldId - 'biRate' | 'sbn10y' | 'foreignFlow' | 'moodys'
 * @param {number} value
 */
export async function updateManualValue(fieldId, value) {
  // Update localStorage immediately
  const local = loadLocal();
  const manualValues = { ...(local.manualValues || {}), [fieldId]: value };
  saveLocal({ manualValues });

  // Persist to DB
  try {
    await fetch('/api/manual-values', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ field_id: fieldId, value }),
    });
  } catch {}
}

// ─── Utility: get current snapshot (latest values) ────────────────────────────

export function loadCurrentValues() {
  const local = loadLocal();
  return local.current || null;
}

export function loadLastUpdate() {
  const local = loadLocal();
  return local.lastUpdate || null;
}
