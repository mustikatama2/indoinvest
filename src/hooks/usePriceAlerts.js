// src/hooks/usePriceAlerts.js
// Manages price alert state + fires browser notifications when targets are crossed.

import { useState, useRef, useCallback } from 'react';

const STORAGE_KEY = 'indoinvest-alerts';

function loadAlerts() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function saveAlerts(alerts) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts)); } catch {}
}

function fireNotification(ticker, price, target, direction) {
  if (Notification.permission !== 'granted') return;
  const msg = direction === 'below'
    ? `${ticker} dropped to ${price.toLocaleString()} (target ≤ ${target.toLocaleString()})`
    : `${ticker} rose to ${price.toLocaleString()} (target ≥ ${target.toLocaleString()})`;
  try {
    new Notification(`IndoInvest Alert — ${ticker}`, {
      body:  msg,
      icon:  '/favicon.ico',
      tag:   `indoinvest-${ticker}`,  // replaces previous alert for same ticker
    });
  } catch {}
}

/**
 * usePriceAlerts
 *
 * Returns:
 *   alerts        — { [ticker]: { target: number, direction: 'below'|'above', enabled: bool } }
 *   setAlert      — (ticker, patch) => void
 *   removeAlert   — (ticker) => void
 *   checkAlerts   — (prevValues, newValues) => void  — call after each live fetch
 *   permission    — Notification.permission string
 *   requestPerm   — () => Promise<void>
 */
export function usePriceAlerts() {
  const [alerts, setAlertsState] = useState(() => loadAlerts());
  const [permission, setPermission] = useState(
    () => (typeof Notification !== 'undefined' ? Notification.permission : 'default')
  );

  // Track which alerts have already fired this session to avoid repeated notifications
  const firedRef = useRef(new Set());

  const setAlert = useCallback((ticker, patch) => {
    setAlertsState(prev => {
      const next = { ...prev, [ticker]: { ...(prev[ticker] || {}), ...patch } };
      saveAlerts(next);
      return next;
    });
    firedRef.current.delete(ticker); // reset fired state when alert is updated
  }, []);

  const removeAlert = useCallback((ticker) => {
    setAlertsState(prev => {
      const next = { ...prev };
      delete next[ticker];
      saveAlerts(next);
      return next;
    });
    firedRef.current.delete(ticker);
  }, []);

  const requestPerm = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  /**
   * Call after every live fetch with previous + new values.
   * Fires notification if a price has crossed its target.
   */
  const checkAlerts = useCallback((prevValues, newValues) => {
    Object.entries(alerts).forEach(([ticker, alert]) => {
      if (!alert?.enabled || !alert?.target) return;
      const pk      = ticker.toLowerCase() + 'Price';
      const prev    = prevValues?.[pk];
      const current = newValues?.[pk];
      if (!prev || !current) return;

      const key = `${ticker}-${alert.target}-${alert.direction}`;
      if (firedRef.current.has(key)) return; // already fired

      const crossed =
        alert.direction === 'below'
          ? prev > alert.target && current <= alert.target
          : prev < alert.target && current >= alert.target;

      if (crossed) {
        fireNotification(ticker, current, alert.target, alert.direction);
        firedRef.current.add(key);
      }
    });
  }, [alerts]);

  return { alerts, setAlert, removeAlert, checkAlerts, permission, requestPerm };
}
